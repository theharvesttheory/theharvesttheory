"""Server-side challenge verification. Production cannot select the fake adapter."""
import httpx
from errors import APIError

SITEVERIFY='https://challenges.cloudflare.com/turnstile/v0/siteverify'

async def verify_token(settings,client,token,action):
    if not isinstance(token,str) or not token or len(token)>2048:
        raise APIError(400,'verification_failed','Please refresh the verification and try again.')
    if settings.bot_mode=='fake':
        if settings.app_env not in ('local','test'):
            raise APIError(503,'verification_unavailable','Verification is unavailable.')
        return
    try:
        result=await client.post(SITEVERIFY,json={'secret':settings.turnstile_secret_key,
                                                 'response':token},timeout=5)
        if result.status_code!=200:
            raise APIError(503,'verification_unavailable','Please retry verification.',retry_after=5)
        payload=result.json()
    except (httpx.HTTPError,ValueError):
        raise APIError(503,'verification_unavailable','Please retry verification.',retry_after=5) from None
    if not isinstance(payload,dict) or type(payload.get('success')) is not bool:
        raise APIError(503,'verification_unavailable','Please retry verification.',retry_after=5)
    codes=payload.get('error-codes',[])
    if not isinstance(codes,list):
        raise APIError(503,'verification_unavailable','Please retry verification.',retry_after=5)
    if any(code in ('invalid-input-secret','missing-input-secret','internal-error') for code in codes):
        raise APIError(503,'verification_unavailable','Please retry verification.',retry_after=5)
    if (payload['success'] is not True or payload.get('hostname') not in settings.turnstile_hostnames
            or payload.get('action')!=action):
        raise APIError(400,'verification_failed','Please refresh the verification and try again.')
