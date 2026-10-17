from uuid import uuid4
from unittest.mock import AsyncMock
import pytest
from pymongo.errors import AutoReconnect
from contracts import CONTACT_TYPES
from test_enquiry_validation import body

@pytest.mark.parametrize('kind', list(CONTACT_TYPES))
def test_every_enquiry_type_has_safe_receipt(client,kind):
    response=client.post('/api/enquiries',json=body(kind),headers={'Idempotency-Key':str(uuid4())})
    assert response.status_code==201
    assert set(response.json())=={'id','status'}
    assert response.json()['status']=='received'


def test_duplicate_receipt_and_conflicting_key(client):
    key={'Idempotency-Key':str(uuid4())}; value=body()
    first=client.post('/api/enquiries',json=value,headers=key)
    second=client.post('/api/enquiries',json=value,headers=key)
    assert first.status_code==201 and second.status_code==200
    assert first.json()==second.json()
    value['fields']['message']='Different'
    assert client.post('/api/enquiries',json=value,headers=key).status_code==409

@pytest.mark.parametrize('headers',[{}, {'Idempotency-Key':'invalid'}])
def test_requires_uuid_key(client,headers):
    assert client.post('/api/enquiries',json=body(),headers=headers).status_code==422


def test_validation_errors_never_echo_input_or_private_keys(client,caplog):
    value=body();value['fields']['email']='sensitive-invalid-value'
    response=client.post('/api/enquiries',json=value,headers={'Idempotency-Key':str(uuid4())})
    assert response.status_code==422
    assert 'sensitive-invalid-value' not in response.text+caplog.text
    assert 'person@example.com' not in response.text


def test_database_failure_returns_retriable_error_not_success(client,caplog):
    client.app.state.repository.save_enquiry=AsyncMock(side_effect=AutoReconnect('PRIVATE URI'))
    response=client.post('/api/enquiries',json=body(),headers={'Idempotency-Key':str(uuid4())})
    assert response.status_code==503
    assert 'PRIVATE URI' not in response.text+caplog.text
    assert response.json()['error']['code']=='temporarily_unavailable'
