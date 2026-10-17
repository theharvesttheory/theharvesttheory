import pytest
from pymongo.errors import DuplicateKeyError

@pytest.mark.asyncio
async def test_required_indexes_exist_and_setup_is_idempotent(settings):
    from repository import MongoRepository
    repo=MongoRepository(settings)
    try:
        await repo.start();await repo.start()
        enquiries=await repo.db.enquiries.index_information()
        subscribers=await repo.db.newsletter_subscribers.index_information()
        limits=await repo.db.rate_limits.index_information()
        assert enquiries['idempotency_key_1']['unique'] is True
        assert subscribers['email_1']['unique'] is True
        assert limits['expires_at_1']['expireAfterSeconds']==0
        assert repo.indexes_ready
        for name in ('enquiries','newsletter_subscribers'):
            indexes=await repo.db[name].index_information()
            assert 'jobs.ops_email.state_1_jobs.ops_email.next_attempt_at_1_jobs.ops_email.lease_until_1' in indexes
        await repo.db.enquiries.insert_one({'idempotency_key':'same'})
        with pytest.raises(DuplicateKeyError):
            await repo.db.enquiries.insert_one({'idempotency_key':'same'})
        await repo.db.newsletter_subscribers.insert_one({'email':'a@example.test'})
        with pytest.raises(DuplicateKeyError):
            await repo.db.newsletter_subscribers.insert_one({'email':'a@example.test'})
    finally: await repo.close()

@pytest.mark.asyncio
async def test_index_failure_never_marks_repository_ready(settings,monkeypatch):
    from repository import MongoRepository
    repo=MongoRepository(settings)
    async def fail(): raise RuntimeError('injected index failure')
    monkeypatch.setattr(repo,'ensure_indexes',fail)
    try:
        with pytest.raises(RuntimeError): await repo.start()
        assert not repo.indexes_ready
    finally: await repo.close()
