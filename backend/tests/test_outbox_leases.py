import asyncio
from uuid import uuid4
from datetime import timedelta
import pytest
from delivery_models import new_job

async def prepare(settings,clock,collection='enquiries',slot='ops_email',history=False):
    from repository import MongoRepository
    from outbox import Outbox
    repo=MongoRepository(settings);await repo.start()
    generation=str(uuid4());job=new_job(slot,{'text':'synthetic'},generation,clock())
    doc={'_id':str(uuid4()),'idempotency_key':str(uuid4()),'email':f'{uuid4()}@example.test',
         'state':'pending','generation':generation,'confirmation_expires_at':clock()+timedelta(hours=24),
         'jobs':{} if history else {slot:job},'job_history':[job] if history else []}
    await repo.db[collection].insert_one(doc)
    return repo,Outbox(repo,settings,clock),doc

@pytest.mark.asyncio
@pytest.mark.parametrize('collection,slot,history',[
 ('enquiries','ops_email',False),('enquiries','slack',False),
 ('newsletter_subscribers','confirmation_email',False),
 ('newsletter_subscribers','ops_email',True),('newsletter_subscribers','slack',True)])
async def test_two_workers_cannot_claim_the_same_live_lease(settings,clock,collection,slot,history):
    repo,outbox,doc=await prepare(settings,clock,collection,slot,history)
    try:
        claims=await asyncio.gather(outbox.claim(collection,slot,history=history),outbox.claim(collection,slot,history=history))
        winner=[c for c in claims if c is not None]
        assert len(winner)==1
        assert winner[0].job['attempts']==1 and winner[0].job['first_attempt_at']==clock()
        assert await outbox.finish(winner[0],{'state':'simulated'})
        assert await outbox.claim(collection,slot,history=history) is None
    finally:await repo.close()

@pytest.mark.asyncio
@pytest.mark.parametrize('history',[False,True])
async def test_expired_lease_is_recovered_and_old_owner_cannot_complete(settings,clock,history):
    repo,outbox,doc=await prepare(settings,clock,'newsletter_subscribers','ops_email',history)
    try:
        first=await outbox.claim('newsletter_subscribers','ops_email',history=history)
        clock.advance(61)
        assert not await outbox.finish(first,{'state':'accepted'})
        second=await outbox.claim('newsletter_subscribers','ops_email',history=history)
        assert second.owner!=first.owner and second.job['attempts']==2
        assert second.job['first_attempt_at']==first.job['first_attempt_at']
        assert not await outbox.finish(first,{'state':'accepted'})
        assert await outbox.finish(second,{'state':'accepted','provider_id':'provider-test-id'})
    finally:await repo.close()

@pytest.mark.asyncio
async def test_future_job_is_not_claimed(settings,clock):
    repo,outbox,doc=await prepare(settings,clock)
    try:
        await repo.db.enquiries.update_one({'_id':doc['_id']},{'$set':{'jobs.ops_email.next_attempt_at':clock()+timedelta(seconds=60)}})
        assert await outbox.claim('enquiries','ops_email') is None
    finally:await repo.close()

@pytest.mark.asyncio
async def test_old_confirmation_worker_cannot_complete_after_generation_change(settings,clock):
    from newsletter import NewsletterService
    from test_newsletter_requests import signup
    from repository import MongoRepository
    from outbox import Outbox
    repo=MongoRepository(settings);await repo.start()
    try:
        service=NewsletterService(repo,settings,clock);await service.request_signup(signup())
        outbox=Outbox(repo,settings,clock)
        claim=await outbox.claim('newsletter_subscribers','confirmation_email')
        clock.advance(601);await service.request_signup(signup())
        assert not await outbox.finish(claim,{'state':'accepted'})
        after=await repo.db.newsletter_subscribers.find_one({})
        assert after['jobs']['confirmation_email']['state']=='pending'
    finally:await repo.close()

@pytest.mark.asyncio
async def test_operational_completion_follows_job_moved_to_history(settings,clock):
    from newsletter import NewsletterService
    from test_newsletter_requests import signup
    repo,outbox,doc=await prepare(settings,clock,'newsletter_subscribers','ops_email')
    try:
        claim=await outbox.claim('newsletter_subscribers','ops_email')
        # Model the same atomic active-to-history move performed by re-signup.
        await repo.db.newsletter_subscribers.update_one({'_id':doc['_id']},[
            {'$set':{'job_history':['$jobs.ops_email'],'jobs':{},'generation':str(uuid4())}}])
        assert await outbox.finish(claim,{'state':'accepted'})
        after=await repo.db.newsletter_subscribers.find_one({'_id':doc['_id']})
        assert after['job_history'][0]['state']=='accepted'
    finally:await repo.close()
