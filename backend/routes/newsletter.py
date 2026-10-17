from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from abuse import enforce_limits, reject_honeypot
from bot_verification import verify_token
from models import normalize_newsletter, IntakeValidationError

router=APIRouter(prefix='/api/newsletter')

class ActionInput(BaseModel):
    model_config=ConfigDict(extra='forbid',strict=True)
    token: str = Field(min_length=1,max_length=4096)

def result(value,status=200):
    return JSONResponse(value,status_code=status,headers={'Cache-Control':'no-store'})

@router.post('')
async def signup(request: Request):
    state=request.app.state
    await enforce_limits(request)
    value=normalize_newsletter(await request.json(),allow_test_domains=state.settings.app_env!='production')
    reject_honeypot(value)
    await verify_token(state.settings,state.providers,value['turnstile_token'],'newsletter')
    return result(await state.newsletter.request_signup(value),202)

async def action_token(request):
    await enforce_limits(request)
    try:
        return ActionInput.model_validate(await request.json()).token
    except ValidationError:
        raise IntakeValidationError('token','A valid action link is required.') from None

@router.post('/confirm')
async def confirm(request: Request):
    return result(await request.app.state.newsletter.confirm(await action_token(request)))

@router.post('/unsubscribe')
async def unsubscribe(request: Request):
    return result(await request.app.state.newsletter.unsubscribe(await action_token(request)))
