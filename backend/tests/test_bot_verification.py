from dataclasses import replace
from uuid import uuid4
import httpx
import pytest
from fastapi.testclient import TestClient
from pymongo.errors import AutoReconnect
from test_enquiry_validation import body


def live_settings(settings):
    return replace(settings,bot_mode='turnstile',turnstile_secret_key='test-key',
                   turnstile_hostnames=('harvest.example.test',))

@pytest.mark.asyncio
@pytest.mark.parametrize('payload,status',[
 ({'success':True,'hostname':'harvest.example.test','action':'enquiry'},None),
 ({'success':False,'error-codes':['invalid-input-response']},400),
 ({'success':True,'hostname':'evil.example.test','action':'enquiry'},400),
 ({'success':True,'hostname':'harvest.example.test','action':'newsletter'},400),
 ({'success':False,'error-codes':['timeout-or-duplicate']},400),
 ({'success':False,'error-codes':['invalid-input-secret']},503),
 ({'success':'true','hostname':'harvest.example.test','action':'enquiry'},503),
 ([],503),
])
async def test_siteverify_checks_bool_hostname_and_action(settings,payload,status):
    from bot_verification import verify_token
    from errors import APIError
    def capture(request):
        assert str(request.url)=='https://challenges.cloudflare.com/turnstile/v0/siteverify'
        return httpx.Response(200,json=payload)
    async with httpx.AsyncClient(transport=httpx.MockTransport(capture)) as client:
        if status:
            with pytest.raises(APIError) as error:
                await verify_token(live_settings(settings),client,'private-token','enquiry')
            assert error.value.status==status
        else: await verify_token(live_settings(settings),client,'private-token','enquiry')

@pytest.mark.asyncio
async def test_timeout_is_service_unavailable_without_bypass(settings,caplog):
    from bot_verification import verify_token
    from errors import APIError
    def timeout(request): raise httpx.ReadTimeout('PRIVATE TOKEN',request=request)
    async with httpx.AsyncClient(transport=httpx.MockTransport(timeout)) as client:
        with pytest.raises(APIError) as error:
            await verify_token(live_settings(settings),client,'private-token','enquiry')
        assert error.value.status==503
        assert 'PRIVATE TOKEN' not in str(error.value)+caplog.text


def test_saved_retry_does_not_revalidate_single_use_token(settings,clock):
    from server import create_app
    requests=[]
    def handler(request):
        requests.append(request)
        return httpx.Response(200,json={'success':len(requests)==1,
            'hostname':'harvest.example.test','action':'enquiry'})
    factory=lambda s:httpx.AsyncClient(transport=httpx.MockTransport(handler))
    with TestClient(create_app(live_settings(settings),clock=clock,provider_factory=factory)) as client:
        headers={'Idempotency-Key':str(uuid4())}
        first=client.post('/api/enquiries',json=body(),headers=headers)
        second=client.post('/api/enquiries',json=body(),headers=headers)
        assert first.status_code==201 and second.status_code==200
        assert first.json()==second.json()
        assert len(requests)==1


def test_failed_save_requires_a_fresh_token_on_retry(settings,clock):
    import json
    from server import create_app
    tokens=set()
    def handler(request):
        token=json.loads(request.content)['response'];valid=token not in tokens;tokens.add(token)
        return httpx.Response(200,json={'success':valid,'hostname':'harvest.example.test','action':'enquiry'})
    factory=lambda s:httpx.AsyncClient(transport=httpx.MockTransport(handler))
    with TestClient(create_app(live_settings(settings),clock=clock,provider_factory=factory)) as client:
        repo=client.app.state.repository;original=repo.save_enquiry
        async def fail(*args,**kwargs): raise AutoReconnect('injected before persist')
        repo.save_enquiry=fail
        headers={'Idempotency-Key':str(uuid4())};value=body()
        assert client.post('/api/enquiries',json=value,headers=headers).status_code==503
        repo.save_enquiry=original
        assert client.post('/api/enquiries',json=value,headers=headers).status_code==400
        value['turnstile_token']='fresh-token'
        assert client.post('/api/enquiries',json=value,headers=headers).status_code==201


def test_direct_forged_token_cannot_save(settings,clock):
    from server import create_app
    factory=lambda s:httpx.AsyncClient(transport=httpx.MockTransport(lambda r:httpx.Response(200,json={'success':False})))
    with TestClient(create_app(live_settings(settings),clock=clock,provider_factory=factory)) as client:
        assert client.post('/api/enquiries',json=body(),headers={'Idempotency-Key':str(uuid4())}).status_code==400
        assert client.portal.call(client.app.state.repository.db.enquiries.count_documents,{})==0
