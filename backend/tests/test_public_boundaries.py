from uuid import uuid4
import pytest
from test_enquiry_validation import body

@pytest.mark.parametrize('size,status',[(32768,422),(32769,413)])
def test_body_byte_limit_before_json_validation(client,size,status):
    r=client.post('/api/enquiries',content=b'{}'+b' '*(size-2),headers={'Content-Type':'application/json'})
    assert r.status_code==status

@pytest.mark.asyncio
async def test_chunked_oversize_body_without_content_length_never_reaches_route():
    from middleware import PublicBoundaryMiddleware
    calls=[];messages=[]
    async def inner(scope, receive, send): calls.append(True)
    chunks=iter([{'type':'http.request','body':b'x'*16000,'more_body':True},
                 {'type':'http.request','body':b'x'*18000,'more_body':False}])
    async def receive(): return next(chunks)
    async def send(message): messages.append(message)
    await PublicBoundaryMiddleware(inner)({'type':'http','method':'POST','path':'/api/enquiries',
        'headers':[(b'content-type',b'application/json')]},receive,send)
    assert not calls
    assert messages[0]['status']==413


def test_malformed_json_and_wrong_media_type(client):
    assert client.post('/api/enquiries',content='{',headers={'Content-Type':'application/json'}).status_code==400
    assert client.post('/api/enquiries',content='text',headers={'Content-Type':'text/plain'}).status_code==415


def test_exact_origin_preflight_allows_required_headers(client):
    r=client.options('/api/enquiries',headers={'Origin':'http://localhost:3000',
        'Access-Control-Request-Method':'POST',
        'Access-Control-Request-Headers':'Content-Type,Idempotency-Key'})
    assert r.status_code==200
    assert r.headers['access-control-allow-origin']=='http://localhost:3000'
    assert 'access-control-allow-credentials' not in r.headers


def test_unknown_origin_is_not_granted_cors_access(client):
    r=client.options('/api/enquiries',headers={'Origin':'https://attacker.example.com',
        'Access-Control-Request-Method':'POST'})
    assert r.status_code==400
    assert 'access-control-allow-origin' not in r.headers


def test_non_browser_request_still_uses_validation(client):
    bad=body();bad['fields']['email']='bad'
    assert client.post('/api/enquiries',json=bad,headers={'Idempotency-Key':str(uuid4())}).status_code==422


def test_unexpected_failure_is_sanitized_and_does_not_escape(client,caplog):
    async def fail(*a,**k): raise RuntimeError('PRIVATE MESSAGE')
    client.app.state.repository.lookup_enquiry=fail
    response=client.post('/api/enquiries',json=body(),headers={'Idempotency-Key':str(uuid4())})
    assert response.status_code==500
    assert 'PRIVATE MESSAGE' not in response.text+caplog.text
    assert response.json()['error']['request_id']
