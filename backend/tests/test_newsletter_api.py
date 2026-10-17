from unittest.mock import AsyncMock
from pymongo.errors import AutoReconnect
from test_newsletter_requests import signup


def record(client):
    return client.portal.call(client.app.state.repository.db.newsletter_subscribers.find_one,{})


def test_signup_receipts_do_not_disclose_membership(client):
    first=client.post('/api/newsletter',json=signup())
    second=client.post('/api/newsletter',json=signup())
    assert first.status_code==202 and second.status_code==202
    assert first.json()==second.json()=={'status':'requested'}
    assert first.headers['cache-control']=='no-store'
    assert record(client)['state']=='pending'


def test_confirm_and_unsubscribe_require_explicit_post(client):
    from newsletter_tokens import create_action_token
    assert client.post('/api/newsletter',json=signup()).status_code==202
    doc=record(client);settings=client.app.state.settings
    confirm=create_action_token(doc,'confirm',settings)
    unsubscribe=create_action_token(doc,'unsubscribe',settings)
    assert client.get('/api/newsletter/confirm').status_code in (404,405)
    assert record(client)['state']=='pending'
    for _ in range(2):
        response=client.post('/api/newsletter/confirm',json={'token':confirm})
        assert response.status_code==200 and response.json()=={'status':'subscribed'}
    assert client.post('/api/newsletter/unsubscribe',json={'token':unsubscribe}).json()=={'status':'unsubscribed'}
    assert client.post('/api/newsletter/confirm',json={'token':confirm}).status_code==400
    assert record(client)['state']=='unsubscribed'


def test_invalid_tokens_and_input_are_safe(client,caplog):
    r=client.post('/api/newsletter/confirm',json={'token':'PRIVATE TOKEN'})
    assert r.status_code==400
    assert 'PRIVATE TOKEN' not in r.text+caplog.text
    assert client.post('/api/newsletter',json={**signup(),'consent':False}).status_code==422
    assert client.get('/api/newsletter/subscribers').status_code==404


def test_newsletter_db_failure_does_not_acknowledge_success(client):
    client.app.state.newsletter.request_signup=AsyncMock(side_effect=AutoReconnect('SECRET'))
    r=client.post('/api/newsletter',json=signup())
    assert r.status_code==503 and 'SECRET' not in r.text


def test_action_endpoints_are_rate_limited(client):
    for _ in range(10):
        assert client.post('/api/newsletter/unsubscribe',json={'token':'bad'}).status_code==400
    assert client.post('/api/newsletter/unsubscribe',json={'token':'bad'}).status_code==429


def test_newsletter_honeypot_is_checked(client):
    r=client.post('/api/newsletter',json={**signup(),'website':'spam'})
    assert r.status_code==400 and record(client) is None
