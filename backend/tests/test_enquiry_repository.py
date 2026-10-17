import asyncio
from datetime import datetime, timezone
import pytest
from pymongo.errors import AutoReconnect
from test_enquiry_validation import body

@pytest.fixture
def now(): return datetime(2026,10,17,tzinfo=timezone.utc)

async def setup(settings):
    from repository import MongoRepository
    repo=MongoRepository(settings); await repo.start();return repo

def arguments(now):
    from models import normalize_enquiry, payload_hash
    from delivery_models import new_job
    normalized=normalize_enquiry(body())
    jobs={slot:new_job(slot,{'text':'synthetic'},'initial',now) for slot in ('ops_email','slack')}
    return normalized,'retry-key',payload_hash(normalized),jobs,now

@pytest.mark.asyncio
async def test_save_and_matching_replay_return_same_record(settings, now):
    repo=await setup(settings)
    try:
        first=await repo.save_enquiry(*arguments(now))
        second=await repo.save_enquiry(*arguments(now))
        assert first.created and not second.created
        assert first.record['_id']==second.record['_id']
        assert await repo.db.enquiries.count_documents({})==1
        saved=await repo.db.enquiries.find_one({})
        assert set(saved['jobs'])=={'ops_email','slack'}
        assert all(j['state']=='pending' for j in saved['jobs'].values())
        assert 'turnstile_token' not in saved and 'website' not in saved
    finally: await repo.close()

@pytest.mark.asyncio
async def test_conflicting_key_cannot_replace_payload(settings,now):
    from repository import IdempotencyConflict
    repo=await setup(settings)
    try:
        args=arguments(now);await repo.save_enquiry(*args)
        with pytest.raises(IdempotencyConflict):
            await repo.save_enquiry(args[0],args[1],'changed-hash',args[3],now)
        assert await repo.db.enquiries.count_documents({})==1
    finally: await repo.close()

@pytest.mark.asyncio
async def test_ten_concurrent_retries_save_one_record_and_job_set(settings,now):
    repo=await setup(settings)
    try:
        results=await asyncio.gather(*(repo.save_enquiry(*arguments(now)) for _ in range(10)))
        assert sum(r.created for r in results)==1
        assert len({r.record['_id'] for r in results})==1
        assert await repo.db.enquiries.count_documents({})==1
    finally: await repo.close()

@pytest.mark.asyncio
async def test_retry_resolves_commit_followed_by_lost_ack(settings,now,monkeypatch):
    repo=await setup(settings)
    try:
        original=repo.insert_enquiry
        async def commit_then_disconnect(document):
            await original(document)
            raise AutoReconnect('injected lost acknowledgement')
        monkeypatch.setattr(repo,'insert_enquiry',commit_then_disconnect)
        with pytest.raises(AutoReconnect): await repo.save_enquiry(*arguments(now))
        monkeypatch.setattr(repo,'insert_enquiry',original)
        result=await repo.save_enquiry(*arguments(now))
        assert not result.created
        assert await repo.db.enquiries.count_documents({})==1
    finally: await repo.close()
