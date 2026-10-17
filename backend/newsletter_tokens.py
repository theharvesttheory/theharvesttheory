"""Signed, narrow action links. Membership state is checked separately in Mongo."""
from datetime import timedelta
from uuid import UUID
import jwt
from errors import APIError

ISSUER='theharvesttheory'
AUDIENCE='newsletter'
REQUIRED=['iss','aud','sub','exp','iat','purpose','generation']
LIFETIMES={'confirm':86400,'unsubscribe':90*86400}

def invalid_link():
    return APIError(400,'invalid_link','This link is invalid or expired. Request a new email.')

def create_action_token(subscriber,purpose,settings):
    if purpose not in LIFETIMES:
        raise ValueError('Unsupported newsletter action')
    issued=subscriber['generation_created_at']
    expires=subscriber['confirmation_expires_at'] if purpose=='confirm' else issued+timedelta(days=90)
    claims={'iss':ISSUER,'aud':AUDIENCE,'sub':subscriber['_id'],
            'generation':subscriber['generation'],'purpose':purpose,
            'iat':int(issued.timestamp()),'exp':int(expires.timestamp())}
    return jwt.encode(claims,settings.newsletter_signing_key,algorithm='HS256')

def verify_action_token(token,purpose,settings,now):
    if purpose not in LIFETIMES or not isinstance(token,str) or len(token)>4096:
        raise invalid_link()
    try:
        claims=jwt.decode(token,settings.newsletter_signing_key,algorithms=['HS256'],
            audience=AUDIENCE,issuer=ISSUER,options={'require':REQUIRED,
            'verify_exp':False,'verify_iat':False})
        # Use the injected clock, but preserve strict time/type validation.
        if type(claims['iat']) is not int or type(claims['exp']) is not int:
            raise ValueError()
        if not claims['iat']<=now.timestamp()<claims['exp']:
            raise ValueError()
        if claims['exp']-claims['iat']>LIFETIMES[purpose] or claims['purpose']!=purpose:
            raise ValueError()
        if str(UUID(claims['sub']))!=claims['sub'] or str(UUID(claims['generation']))!=claims['generation']:
            raise ValueError()
        return claims
    except (jwt.InvalidTokenError,ValueError,TypeError,KeyError,AttributeError):
        raise invalid_link() from None
