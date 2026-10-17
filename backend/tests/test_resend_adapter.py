import json
from datetime import datetime, timezone
import httpx
import pytest

JOB={'job_id':'job-test-id','payload':{'from':'Harvest <hello@example.test>',
    'to':['team@example.test'],'subject':'Synthetic test','html':'<p>Test</p>'}}

@pytest.mark.asyncio
async def test_fixed_endpoint_headers_timeout_and_stable_payload():
    from notifications.resend import ResendAdapter
    requests=[]
    def capture(request):
        requests.append(request)
        assert str(request.url)=='https://api.resend.com/emails'
        assert request.headers['Authorization']=='Bearer TEST-SECRET'
        assert request.headers['Idempotency-Key']=='tht/job-test-id'
        assert request.extensions['timeout']['read']==10
        assert json.loads(request.content)==JOB['payload']
        return httpx.Response(200,json={'id':'email-provider-id'})
    async with httpx.AsyncClient(transport=httpx.MockTransport(capture)) as client:
        adapter=ResendAdapter(client,'TEST-SECRET')
        a=await adapter.send(JOB);b=await adapter.send(JOB)
        assert a.kind==b.kind=='accepted' and a.provider_id=='email-provider-id'
        assert requests[0].content==requests[1].content

@pytest.mark.asyncio
@pytest.mark.parametrize('status,payload,kind',[
 (429,{},'retryable'),(500,{},'retryable'),(401,{},'permanent'),
 (409,{'name':'concurrent_idempotent_requests'},'retryable'),
 (409,{'name':'invalid_idempotent_request'},'permanent'),
 (200,{},'unknown'),(200,{'id':None},'unknown'),(302,{},'permanent')])
async def test_response_classification(status,payload,kind):
    from notifications.resend import ResendAdapter
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r:httpx.Response(status,json=payload,headers={'Retry-After':'20'}))) as client:
        outcome=await ResendAdapter(client,'TEST-SECRET').send(JOB)
        assert outcome.kind==kind
        if status==429:assert outcome.retry_after==20

@pytest.mark.asyncio
async def test_ambiguous_timeout_does_not_claim_acceptance_or_log_credentials(caplog):
    from notifications.resend import ResendAdapter
    def fail(request):raise httpx.ReadTimeout('SECRET BODY',request=request)
    async with httpx.AsyncClient(transport=httpx.MockTransport(fail)) as client:
        result=await ResendAdapter(client,'TEST-SECRET').send(JOB)
        assert result.kind=='unknown'
        assert 'TEST-SECRET' not in caplog.text+repr(result)
        assert 'SECRET BODY' not in caplog.text+repr(result)


def test_retry_after_bounds_and_http_date():
    from notifications.common import retry_after
    now=datetime(2026,10,17,12,tzinfo=timezone.utc)
    assert retry_after('99999',now)==7200
    assert retry_after('-1',now)==0
    assert retry_after('Sat, 17 Oct 2026 12:01:00 GMT',now)==60
    assert retry_after('garbage',now)==0
