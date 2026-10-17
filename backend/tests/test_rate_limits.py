import asyncio
from dataclasses import replace
from uuid import uuid4
from unittest.mock import AsyncMock
import pytest
from fastapi.testclient import TestClient
from pymongo.errors import AutoReconnect
from starlette.requests import Request
from test_enquiry_validation import body


def submit(client, **headers):
    return client.post('/api/enquiries',json=body(),headers={'Idempotency-Key':str(uuid4()),**headers})


def test_limit_is_shared_between_app_instances(settings,clock,provider_factory):
    from server import create_app
    with TestClient(create_app(settings,clock=clock,provider_factory=provider_factory)) as a:
        with TestClient(create_app(settings,clock=clock,provider_factory=provider_factory)) as b:
            for i in range(10): assert submit(a if i%2 else b).status_code==201
            response=submit(b)
            assert response.status_code==429
            assert 1<=int(response.headers['retry-after'])<=600
            clock.advance(601)
            assert submit(a).status_code==201


def test_forged_forwarding_headers_do_not_reset_limit(client):
    for i in range(10):
        assert submit(client,**{'X-Forwarded-For':f'203.0.113.{i}','CF-Connecting-IP':f'203.0.113.{i}'}).status_code==201
    assert submit(client,**{'X-Forwarded-For':'198.51.100.20'}).status_code==429


def test_global_cap_is_independent_of_ip(settings,clock,provider_factory):
    from server import create_app
    settings=replace(settings,global_rate_limit=2)
    with TestClient(create_app(settings,clock=clock,provider_factory=provider_factory)) as client:
        assert submit(client).status_code==201
        assert submit(client).status_code==201
        assert submit(client).status_code==429


def test_honeypot_blocks_record_creation(client):
    value=body();value['website']='spam'
    client.app.state.repository.save_enquiry=AsyncMock()
    assert client.post('/api/enquiries',json=value,headers={'Idempotency-Key':str(uuid4())}).status_code==400
    client.app.state.repository.save_enquiry.assert_not_awaited()


def test_rate_database_failure_is_closed(client):
    from abuse import enforce_limits
    client.app.state.repository.increment_rate=AsyncMock(side_effect=AutoReconnect('private'))
    assert submit(client).status_code==503

@pytest.mark.asyncio
async def test_concurrent_rate_increment_is_atomic_and_contains_no_raw_ip(settings,clock):
    from repository import MongoRepository
    from abuse import check_limit
    from errors import APIError
    repo=MongoRepository(settings);await repo.start()
    try:
        async def attempt():
            try:
                await check_limit(repo,settings,'ip','203.0.113.99',10,600,clock())
                return True
            except APIError as exc:
                assert exc.status==429;return False
        assert sum(await asyncio.gather(*(attempt() for _ in range(20))))==10
        docs=await repo.db.rate_limits.find({}).to_list(None)
        assert '203.0.113.99' not in str(docs)
    finally: await repo.close()


def test_only_verified_proxy_chain_is_trusted(settings):
    from abuse import client_address
    s=replace(settings,trusted_proxy_cidrs=('10.0.0.0/8',))
    def request(peer,chain):
        return Request({'type':'http','client':(peer,1234),'headers':[(b'x-forwarded-for',chain.encode())]})
    assert client_address(request('203.0.113.8','192.0.2.99'),s)=='203.0.113.8'
    assert client_address(request('10.0.0.1','192.0.2.99, 203.0.113.8'),s)=='203.0.113.8'
    assert client_address(request('10.0.0.1','203.0.113.8, 10.0.0.2'),s)=='203.0.113.8'
