from datetime import timedelta
import pytest
from pymongo.errors import AutoReconnect
from notifications.common import Outcome
from test_outbox_leases import prepare

@pytest.mark.parametrize('attempt,seconds',[(1,5),(2,30),(3,120),(4,600),(5,1800),(6,7200),(7,7200)])
def test_jitter_bounds(attempt,seconds,clock):
    from retry_policy import transition
    job={'attempts':attempt,'first_attempt_at':clock()}
    for fraction in (0,1):
        update=transition(job,Outcome('retryable','busy'),clock(),8,lambda:fraction)
        delay=(update['next_attempt_at']-clock()).total_seconds()
        assert seconds*.8 <= delay <= min(7200,seconds*1.2)

def test_limits_unknown_and_retry_after(clock):
    from retry_policy import transition, preflight
    job={'attempts':1,'first_attempt_at':clock()}
    assert transition(job,Outcome('retryable','limit',retry_after=99999),clock(),8)['next_attempt_at']==clock()+timedelta(seconds=7200)
    assert transition({**job,'attempts':8},Outcome('retryable','busy'),clock(),8)['state']=='dead'
    ambiguous=transition({**job,'attempts':8},Outcome('unknown','timeout'),clock(),8)
    assert ambiguous['state']=='unknown' and ambiguous['automatic_paused']
    old={**job,'first_attempt_at':clock()-timedelta(hours=23),'ambiguous':True}
    assert preflight(old,clock(),8)['state']=='unknown'
    assert preflight({**job,'attempts':9},clock(),8)['state']=='dead'

@pytest.mark.asyncio
async def test_channels_independent_and_retry_state_persisted(settings,clock):
    from delivery_models import new_job
    repo,outbox,doc=await prepare(settings,clock)
    try:
        await repo.db.enquiries.update_one({'_id':doc['_id']},{'$set':{'jobs.slack':new_job('slack',{},'1',clock())}})
        email=await outbox.claim('enquiries','ops_email');slack=await outbox.claim('enquiries','slack')
        await outbox.record_outcome(email,Outcome('retryable','http_500'),random=lambda:.5)
        await outbox.record_outcome(slack,Outcome('accepted','provider_accepted'))
        assert await outbox.claim('enquiries','ops_email') is None
        clock.advance(5)
        retry=await outbox.claim('enquiries','ops_email')
        assert retry.job['attempts']==2 and retry.job['first_attempt_at']==email.job['first_attempt_at']
        assert await outbox.claim('enquiries','slack') is None
        assert await outbox.record_outcome(retry,Outcome('accepted','provider_accepted','email-id'))
    finally:await repo.close()

@pytest.mark.asyncio
@pytest.mark.parametrize('history',[False,True])
async def test_downtime_cutoff_blocks_send_and_pauses_unknown(settings,clock,history):
    repo,outbox,doc=await prepare(settings,clock,'newsletter_subscribers','ops_email',history)
    try:
        first=await outbox.claim('newsletter_subscribers','ops_email',history)
        clock.advance(23*3600+1)
        recovered=await outbox.claim('newsletter_subscribers','ops_email',history)
        assert recovered.job['ambiguous']
        assert not await outbox.may_send(recovered)
        assert await outbox.claim('newsletter_subscribers','ops_email',history) is None
        record=await repo.db.newsletter_subscribers.find_one({'_id':doc['_id']})
        job=record['job_history'][0] if history else record['jobs']['ops_email']
        assert job['state']=='unknown' and job['automatic_paused']
    finally:await repo.close()

@pytest.mark.asyncio
async def test_lost_completion_keeps_key_and_payload_on_lease_recovery(settings,clock,monkeypatch):
    repo,outbox,doc=await prepare(settings,clock)
    try:
        first=await outbox.claim('enquiries','ops_email')
        original=outbox.finish
        async def fail(*args,**kwargs):raise AutoReconnect('Synthetic DB interruption')
        monkeypatch.setattr(outbox,'finish',fail)
        with pytest.raises(AutoReconnect):await outbox.record_outcome(first,Outcome('accepted','provider_accepted','id'))
        monkeypatch.setattr(outbox,'finish',original)
        clock.advance(61)
        retry=await outbox.claim('enquiries','ops_email')
        assert retry.job['job_id']==first.job['job_id'] and retry.job['payload']==first.job['payload']
        assert retry.job['ambiguous'] and await outbox.may_send(retry)
        assert not await outbox.record_outcome(first,Outcome('accepted','provider_accepted','id'))
    finally:await repo.close()
