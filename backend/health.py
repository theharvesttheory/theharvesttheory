"""Public health surfaces contain no database or customer details."""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

router=APIRouter(prefix='/api')

@router.get('/health/live')
async def live():
    return {'status':'ok'}

@router.get('/health/ready')
async def ready(request: Request):
    repo=request.app.state.repository
    healthy=repo.indexes_ready
    worker=request.app.state.worker
    if request.app.state.settings.worker_enabled:
        healthy=healthy and worker is not None and worker.healthy()
    try:
        await repo.ping()
    except PyMongoError:
        healthy=False
    return JSONResponse({'status':'ok' if healthy else 'unavailable'},status_code=200 if healthy else 503)

@router.get('/version')
async def version(request: Request):
    return {'sha':request.app.state.settings.app_git_sha}
