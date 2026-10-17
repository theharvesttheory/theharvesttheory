import asyncio
from datetime import timedelta
import pytest


def signup(email='person@example.test'):
    return {'email':email,'consent':True,'privacy_notice_version':'2026-10-17',
            'source_path':'/','website':'','turnstile_token':'token'}

async def service(settings,clock):
    from newsletter import NewsletterService
    from repository import MongoRepository
    repo=MongoRepository(settings);await repo.start()
    return NewsletterService(repo,settings,clock),repo

@pytest.mark.asyncio
async def test_signup_persists_pending_state_consent_and_one_job(settings,clock):
    svc,repo=await service(settings,clock)
    try:
        assert await svc.request_signup(signup())=={'status':'requested'}
        doc=await repo.db.newsletter_subscribers.find_one({})
        assert doc['state']=='pending' and doc['consent_at']==clock()
        assert doc['privacy_notice_version']=='2026-10-17'
        assert set(doc['jobs'])=={'confirmation_email'}
        assert doc['jobs']['confirmation_email']['state']=='pending'
        assert 'turnstile_token' not in doc
    finally:await repo.close()

@pytest.mark.asyncio
@pytest.mark.parametrize('change',[{'consent':False},{'consent':'true'},
    {'privacy_notice_version':'old'},{'email':'bad'},{'extra':'forbidden'}])
async def test_invalid_signup_never_persists(settings,clock,change):
    from models import IntakeValidationError
    svc,repo=await service(settings,clock)
    try:
        value=signup();value.update(change)
        with pytest.raises(IntakeValidationError):await svc.request_signup(value)
        assert await repo.db.newsletter_subscribers.count_documents({})==0
    finally:await repo.close()

@pytest.mark.asyncio
async def test_concurrent_duplicates_are_generic_and_send_one_confirmation(settings,clock):
    svc,repo=await service(settings,clock)
    try:
        results=await asyncio.gather(*(svc.request_signup(signup(' Person@Example.TEST ')) for _ in range(10)))
        assert all(r=={'status':'requested'} for r in results)
        assert await repo.db.newsletter_subscribers.count_documents({})==1
        first=await repo.db.newsletter_subscribers.find_one({})
        await svc.request_signup(signup())
        assert await repo.db.newsletter_subscribers.find_one({})==first
        assert first['email']=='person@example.test'
        clock.advance(601)
        await svc.request_signup(signup())
        after=await repo.db.newsletter_subscribers.find_one({})
        assert after['generation']!=first['generation']
        assert after['confirmation_expires_at']==clock()+timedelta(hours=24)
    finally:await repo.close()

@pytest.mark.asyncio
async def test_subscribed_duplicate_preserves_consent_and_unsubscribe_requires_new_confirmation(settings,clock):
    svc,repo=await service(settings,clock)
    try:
        await svc.request_signup(signup())
        await repo.db.newsletter_subscribers.update_one({}, {'$set':{'state':'subscribed','confirmed_at':clock()}})
        before=await repo.db.newsletter_subscribers.find_one({})
        clock.advance(601);await svc.request_signup(signup())
        assert await repo.db.newsletter_subscribers.find_one({})==before
        await repo.db.newsletter_subscribers.update_one({}, {'$set':{'state':'unsubscribed','unsubscribed_at':clock()}})
        await svc.request_signup(signup())
        after=await repo.db.newsletter_subscribers.find_one({})
        assert after['state']=='pending' and after['generation']!=before['generation']
    finally:await repo.close()

@pytest.mark.asyncio
async def test_new_generation_preserves_undelivered_operational_jobs(settings,clock):
    from delivery_models import new_job
    svc,repo=await service(settings,clock)
    try:
        await svc.request_signup(signup())
        before=await repo.db.newsletter_subscribers.find_one({})
        job=new_job('ops_email',{'text':'prior signup'},before['generation'],clock())
        await repo.db.newsletter_subscribers.update_one({}, {'$set':{'state':'unsubscribed','jobs.ops_email':job}})
        await svc.request_signup(signup())
        after=await repo.db.newsletter_subscribers.find_one({})
        assert any(j['job_id']==job['job_id'] for j in after['job_history'])
        assert after['jobs']['confirmation_email']['generation']==after['generation']
    finally:await repo.close()
