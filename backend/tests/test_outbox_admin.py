from datetime import timedelta
import pytest
from test_outbox_leases import prepare

@pytest.mark.asyncio
async def test_summary_and_inspect_are_private_metadata_only(settings,clock):
    from scripts.outbox_admin import inspect_jobs,summary
    repo,outbox,doc=await prepare(settings,clock)
    try:
        clock.advance(301)
        rows=await inspect_jobs(repo,doc['_id'])
        assert len(rows)==1 and 'payload' not in str(rows) and 'synthetic' not in str(rows)
        metrics=await summary(repo,clock())
        assert metrics['pending']==1 and metrics['oldest_due_seconds']==301 and metrics['degraded']
    finally:await repo.close()

@pytest.mark.asyncio
@pytest.mark.parametrize('history',[False,True])
async def test_retry_dry_run_guards_and_atomic_apply(settings,clock,history):
    from scripts.outbox_admin import retry_job,inspect_jobs
    repo,outbox,doc=await prepare(settings,clock,'newsletter_subscribers','ops_email',history)
    try:
        claim=await outbox.claim('newsletter_subscribers','ops_email',history)
        await outbox.finish(claim,{'state':'unknown','automatic_paused':True,'ambiguous':True})
        args=dict(reference=doc['_id'],channel='ops_email',job_id=claim.job['job_id'],generation=claim.job['generation'])
        before=await repo.db.newsletter_subscribers.find_one({'_id':doc['_id']})
        with pytest.raises(ValueError):await retry_job(repo,clock(),**args,apply=True)
        with pytest.raises(ValueError):await retry_job(repo,clock(),**{**args,'generation':'stale'})
        preview=await retry_job(repo,clock(),**args)
        assert preview['dry_run'] and preview['requires_reconciliation']
        assert before==await repo.db.newsletter_subscribers.find_one({'_id':doc['_id']})
        result=await retry_job(repo,clock(),**args,apply=True,reconciliation='Checked synthetic provider records',allow_possible_duplicate=True)
        assert not result['dry_run']
        assert await outbox.claim('newsletter_subscribers','ops_email',history)
    finally:await repo.close()

@pytest.mark.asyncio
async def test_old_attempt_requires_reconciliation_and_new_identity(settings,clock):
    from scripts.outbox_admin import retry_job,inspect_jobs
    repo,outbox,doc=await prepare(settings,clock)
    try:
        claim=await outbox.claim('enquiries','ops_email')
        await outbox.finish(claim,{'state':'dead','automatic_paused':True})
        clock.advance(24*3600)
        args=dict(reference=doc['_id'],channel='ops_email',job_id=claim.job['job_id'],generation=claim.job['generation'])
        with pytest.raises(ValueError):await retry_job(repo,clock(),**args,apply=True)
        await retry_job(repo,clock(),**args,apply=True,reconciliation='Provider checked',allow_possible_duplicate=True)
        newer=await outbox.claim('enquiries','ops_email')
        assert newer.job['job_id']!=claim.job['job_id'] and newer.job['attempts']==1
        assert newer.job['payload']==claim.job['payload']
    finally:await repo.close()

@pytest.mark.asyncio
async def test_cancelled_confirmation_cannot_replay(settings,clock):
    from scripts.outbox_admin import retry_job
    repo,outbox,doc=await prepare(settings,clock,'newsletter_subscribers','confirmation_email')
    try:
        claim=await outbox.claim('newsletter_subscribers','confirmation_email')
        await outbox.finish(claim,{'state':'cancelled'})
        with pytest.raises(ValueError):await retry_job(repo,clock(),doc['_id'],'confirmation_email',claim.job['job_id'],claim.job['generation'],apply=True)
    finally:await repo.close()
