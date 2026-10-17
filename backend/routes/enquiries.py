from uuid import UUID, uuid4
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from models import normalize_enquiry, payload_hash, IntakeValidationError
from notifications.rendering import build_enquiry_jobs
from abuse import enforce_limits, reject_honeypot
from bot_verification import verify_token

router=APIRouter(prefix='/api')

@router.post('/enquiries')
async def submit(request: Request):
    state=request.app.state
    await enforce_limits(request)
    normalized=normalize_enquiry(await request.json(),allow_test_domains=state.settings.app_env!='production')
    reject_honeypot(normalized)
    try:
        key=str(UUID(request.headers.get('Idempotency-Key','')))
    except ValueError:
        raise IntakeValidationError('idempotency_key','A valid retry key is required.') from None
    digest=payload_hash(normalized)
    existing=await state.repository.lookup_enquiry(key,digest)
    if existing:
        return JSONResponse(existing.receipt,status_code=200,headers={'Cache-Control':'no-store'})
    await verify_token(state.settings,state.providers,normalized['turnstile_token'],'enquiry')
    reference=str(uuid4());now=state.clock()
    factory=getattr(state,'enquiry_job_factory',build_enquiry_jobs)
    jobs=factory(normalized,reference,state.settings,now)
    result=await state.repository.save_enquiry(normalized,key,digest,jobs,now,record_id=reference)
    return JSONResponse(result.receipt,status_code=201 if result.created else 200,
                        headers={'Cache-Control':'no-store'})
