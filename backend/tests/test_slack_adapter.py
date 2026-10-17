import json
import logging
import httpx
import pytest

URL='https://hooks.slack.com/services/TEST/PRIVATE/SECRET'
JOB={'job_id':'job-test','payload':{'text':'Harvest reference test','blocks':[]}}

@pytest.mark.asyncio
async def test_slack_fixed_webhook_payload_and_no_sensitive_logs(caplog):
    from notifications.slack import SlackAdapter
    def handler(request):
        assert str(request.url)==URL
        assert json.loads(request.content)==JOB['payload']
        assert request.extensions['timeout']['read']==10
        return httpx.Response(200,text='ok')
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        adapter=SlackAdapter(client,URL)
        with caplog.at_level(logging.INFO):result=await adapter.send(JOB)
        assert result.kind=='accepted'
        assert 'PRIVATE/SECRET' not in caplog.text

@pytest.mark.asyncio
@pytest.mark.parametrize('status,text,kind',[(429,'limit','retryable'),(500,'error','retryable'),
 (403,'revoked','permanent'),(404,'missing','permanent'),(200,'not ok','unknown'),(302,'redirect','permanent')])
async def test_slack_response_classification(status,text,kind):
    from notifications.slack import SlackAdapter
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r:httpx.Response(status,text=text,headers={'Retry-After':'10'}))) as client:
        result=await SlackAdapter(client,URL).send(JOB)
        assert result.kind==kind
        if status==429:assert result.retry_after==10

@pytest.mark.asyncio
async def test_slack_timeout_is_ambiguous(caplog):
    from notifications.slack import SlackAdapter
    def handler(request):raise httpx.ReadTimeout(URL,request=request)
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result=await SlackAdapter(client,URL).send(JOB)
        assert result.kind=='unknown' and URL not in repr(result)+caplog.text

@pytest.mark.parametrize('url',['https://evil.example.com/hook','http://hooks.slack.com/services/a',
 'https://hooks.slack.com.evil.example.com/services/a'])
def test_unapproved_destination_is_rejected(url):
    from notifications.slack import SlackAdapter
    with pytest.raises(ValueError):SlackAdapter(None,url)
