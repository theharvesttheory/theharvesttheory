from dataclasses import replace
from datetime import timedelta
from uuid import uuid4
import jwt
import pytest

@pytest.fixture
def settings():
    from config import Settings
    return Settings.from_env({})

@pytest.fixture
def subscriber(clock):
    return {'_id':str(uuid4()),'generation':str(uuid4()),'generation_created_at':clock(),
            'confirmation_expires_at':clock()+timedelta(hours=24)}

@pytest.mark.parametrize('purpose',['confirm','unsubscribe'])
def test_valid_action_token_is_deterministic_and_private(settings,subscriber,clock,purpose):
    from newsletter_tokens import create_action_token,verify_action_token
    token=create_action_token(subscriber,purpose,settings)
    assert create_action_token(subscriber,purpose,settings)==token
    claims=verify_action_token(token,purpose,settings,clock())
    assert claims['sub']==subscriber['_id'] and claims['generation']==subscriber['generation']
    assert 'email' not in claims

@pytest.mark.parametrize('mutation',[
    {'purpose':'unsubscribe'},{'aud':'wrong'},{'iss':'wrong'}, {'sub':'not-a-uuid'},
    {'generation':'not-a-uuid'},{'exp':None},{'iat':None},{'exp':True},
])
def test_required_claims_and_purpose_are_checked(settings,subscriber,clock,mutation):
    from newsletter_tokens import create_action_token,verify_action_token
    from errors import APIError
    token=create_action_token(subscriber,'confirm',settings)
    claims=jwt.decode(token,options={'verify_signature':False})
    for key,value in mutation.items():
        if value is None:claims.pop(key,None)
        else:claims[key]=value
    forged=jwt.encode(claims,settings.newsletter_signing_key,algorithm='HS256')
    with pytest.raises(APIError): verify_action_token(forged,'confirm',settings,clock())


def test_wrong_key_algorithm_and_expiry_rejected(settings,subscriber,clock):
    from newsletter_tokens import create_action_token,verify_action_token
    from errors import APIError
    token=create_action_token(subscriber,'confirm',settings)
    with pytest.raises(APIError):
        verify_action_token(token,'confirm',replace(settings,newsletter_signing_key='x'*64),clock())
    claims=jwt.decode(token,options={'verify_signature':False})
    wrong=jwt.encode(claims,settings.newsletter_signing_key,algorithm='HS384')
    with pytest.raises(APIError):verify_action_token(wrong,'confirm',settings,clock())
    clock.advance(86400)
    with pytest.raises(APIError):verify_action_token(token,'confirm',settings,clock())


def test_malformed_link_is_generic_and_never_logged(settings,clock,caplog):
    from newsletter_tokens import verify_action_token
    from errors import APIError
    with pytest.raises(APIError) as result:
        verify_action_token('private-bad-token','confirm',settings,clock())
    assert result.value.status==400
    assert 'private-bad-token' not in str(result.value)+caplog.text
