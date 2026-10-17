"""Public errors expose codes and known field identifiers, never submitted input."""
import logging
from uuid import uuid4
from json import JSONDecodeError
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from models import IntakeValidationError
from repository import IdempotencyConflict

log=logging.getLogger('harvest.intake')

class APIError(Exception):
    def __init__(self,status,code,message,retry_after=None):
        self.status=status;self.code=code;self.message=message;self.retry_after=retry_after
        super().__init__(code)

def response(status,code,message,fields=None,retry_after=None):
    error={'code':code,'message':message,'request_id':str(uuid4())}
    if fields: error['fields']=fields
    headers={'Cache-Control':'no-store'}
    if retry_after is not None: headers['Retry-After']=str(retry_after)
    return JSONResponse({'error':error},status_code=status,headers=headers)

def register_handlers(app):
    @app.exception_handler(IntakeValidationError)
    async def invalid(request,exc):
        return response(422,'invalid_submission','Please check your details.',exc.fields)
    @app.exception_handler(RequestValidationError)
    async def invalid_shape(request,exc):
        return response(422,'invalid_submission','Please check your details.')
    @app.exception_handler(JSONDecodeError)
    async def invalid_json(request,exc):
        return response(400,'invalid_json','Send a valid JSON request.')
    @app.exception_handler(IdempotencyConflict)
    async def conflict(request,exc):
        return response(409,'idempotency_conflict','The retry key belongs to different details. Start a new submission.')
    @app.exception_handler(PyMongoError)
    async def database_unavailable(request,exc):
        log.warning('database_unavailable',extra={'error_class':type(exc).__name__})
        return response(503,'temporarily_unavailable','Please try again with the same details.',retry_after=5)
    @app.exception_handler(APIError)
    async def api_error(request,exc):
        return response(exc.status,exc.code,exc.message,retry_after=exc.retry_after)
