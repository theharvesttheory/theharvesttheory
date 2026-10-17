from datetime import timedelta
from uuid import uuid4
import pytest
from test_outbox_leases import prepare
from delivery_models import new_job

@pytest.mark.asyncio
async def test_retention_dry_run_redacts_only_completed_payloads_and_keeps_unresolved_history(settings,clock):
    from scripts.data_admin import retain
    repo,outbox,doc=await prepare(settings,clock,'newsletter_subscribers','ops_email',True)
    try:
        completed=new_job('confirmation_email',{'text':'PRIVATE ACTION TOKEN'},str(uuid4()),clock()-timedelta(days=10));completed.update(state='simulated',accepted_at=clock()-timedelta(days=8))
        await repo.db.newsletter_subscribers.update_one({'_id':doc['_id']},{'$set':{'created_at':clock()-timedelta(days=200),'jobs.confirmation_email':completed}})
        before=await repo.db.newsletter_subscribers.find_one({'_id':doc['_id']})
        preview=await retain(repo,clock())
        assert preview['redacted_payloads']==1 and preview['review_required']==1 and 'PRIVATE' not in str(preview)
        assert await repo.db.newsletter_subscribers.find_one({'_id':doc['_id']})==before
        await retain(repo,clock(),apply=True,database=settings.db_name,policy_approved=True)
        after=await repo.db.newsletter_subscribers.find_one({'_id':doc['_id']})
        assert 'payload' not in after['jobs']['confirmation_email'] and after['job_history'][0]['payload']
    finally:await repo.close()

@pytest.mark.asyncio
@pytest.mark.parametrize('state',['pending','sending','retry','unknown','dead'])
async def test_old_enquiries_with_unresolved_jobs_are_never_deleted(settings,clock,state):
    from scripts.data_admin import retain
    repo,outbox,doc=await prepare(settings,clock)
    try:
        await repo.db.enquiries.update_one({'_id':doc['_id']},{'$set':{'received_at':clock()-timedelta(days=181),'jobs.ops_email.state':state}})
        report=await retain(repo,clock(),apply=True,database=settings.db_name,policy_approved=True)
        assert report['review_required']==1 and await repo.db.enquiries.count_documents({})==1
    finally:await repo.close()

@pytest.mark.asyncio
async def test_scoped_retention_deletes_old_resolved_records_and_prunes_history(settings,clock):
    from scripts.data_admin import retain
    repo,outbox,doc=await prepare(settings,clock)
    try:
        await repo.db.enquiries.update_one({'_id':doc['_id']},{'$set':{'received_at':clock()-timedelta(days=181),'jobs.ops_email.state':'simulated','jobs.ops_email.accepted_at':clock()-timedelta(days=180)}})
        with pytest.raises(ValueError):await retain(repo,clock(),apply=True)
        await retain(repo,clock(),scope='newsletter',apply=True,database=settings.db_name,policy_approved=True)
        assert await repo.db.enquiries.count_documents({})==1
        await retain(repo,clock(),scope='enquiries',apply=True,database=settings.db_name,policy_approved=True)
        assert await repo.db.enquiries.count_documents({})==0
        job=new_job('slack',{'text':'old'},'old',clock()-timedelta(days=40));job.update(state='simulated',accepted_at=clock()-timedelta(days=31))
        await repo.db.newsletter_subscribers.insert_one({'_id':str(uuid4()),'email':'old@example.test','state':'unsubscribed','created_at':clock()-timedelta(days=200),'jobs':{},'job_history':[job]})
        await retain(repo,clock(),apply=True,database=settings.db_name,policy_approved=True)
        subscriber=await repo.db.newsletter_subscribers.find_one({});assert subscriber['job_history']==[] and subscriber['email']=='old@example.test'
    finally:await repo.close()

@pytest.mark.asyncio
async def test_exact_export_and_delete_exclude_payloads_and_require_apply_scope(settings,clock):
    from scripts.data_admin import export_record,delete_record
    repo,outbox,doc=await prepare(settings,clock)
    try:
        exported=await export_record(repo,'enquiries',doc['_id']);assert 'payload' not in str(exported) and 'synthetic' not in str(exported)
        with pytest.raises(ValueError):await delete_record(repo,'enquiries',doc['_id'],apply=True,database='wrong')
        with pytest.raises(ValueError):await delete_record(repo,'enquiries',doc['_id'],apply=True,database=settings.db_name)
        await repo.db.enquiries.update_one({'_id':doc['_id']},{'$set':{'jobs.ops_email.state':'cancelled'}})
        result=await delete_record(repo,'enquiries',doc['_id']);assert result['dry_run'] and await repo.db.enquiries.count_documents({})==1
        await delete_record(repo,'enquiries',doc['_id'],apply=True,database=settings.db_name);assert await repo.db.enquiries.count_documents({})==0
    finally:await repo.close()

@pytest.mark.asyncio
async def test_expired_pending_signup_deleted_but_new_generation_and_subscribed_preserved(settings,clock):
    from scripts.data_admin import retain
    from repository import MongoRepository
    repo=MongoRepository(settings);await repo.start()
    try:
        for state,age in [('pending',8),('pending',1),('subscribed',200)]:
            await repo.db.newsletter_subscribers.insert_one({'_id':str(uuid4()),'email':f'{uuid4()}@example.test','state':state,
                'created_at':clock()-timedelta(days=300),'generation_created_at':clock()-timedelta(days=age),'jobs':{},'job_history':[]})
        report=await retain(repo,clock(),apply=True,database=settings.db_name,policy_approved=True)
        assert report['eligible_deletions']==1 and await repo.db.newsletter_subscribers.count_documents({})==2
    finally:await repo.close()

@pytest.mark.asyncio
async def test_retention_fence_preserves_new_work_that_arrives_during_review(settings,clock,monkeypatch):
    from scripts.data_admin import retain
    repo,outbox,doc=await prepare(settings,clock,'newsletter_subscribers','ops_email')
    try:
        await repo.db.newsletter_subscribers.update_one({'_id':doc['_id']},{'$set':{'created_at':clock()-timedelta(days=8),'jobs.ops_email.state':'simulated'}})
        # Replace the collection just for the final delete seam; Mongo still arbitrates.
        original=repo.db.newsletter_subscribers
        class Collection:
            def find(self,*args,**kwargs):return original.find(*args,**kwargs)
            async def delete_one(self,query):
                await original.update_one({'_id':doc['_id']},{'$set':{'jobs.ops_email.state':'pending'}})
                return await original.delete_one(query)
        class Database:
            name=settings.db_name
            def __getitem__(self,key):return Collection() if key=='newsletter_subscribers' else repo.client[settings.db_name][key]
        monkeypatch.setattr(repo,'db',Database())
        result=await retain(repo,clock(),scope='newsletter',apply=True,database=settings.db_name,policy_approved=True)
        assert result['concurrent_skips']==1 and await original.count_documents({})==1
    finally:await repo.close()
