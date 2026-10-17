"""Bound bodies before parsing and preserve safe errors across public requests."""
import logging
from starlette.middleware.cors import CORSMiddleware
from errors import response

log=logging.getLogger('harvest.intake')

class PublicBoundaryMiddleware:
    def __init__(self,app,max_bytes=32768):
        self.app=app;self.max_bytes=max_bytes

    async def __call__(self,scope,receive,send):
        if scope['type']!='http':
            return await self.app(scope,receive,send)
        started=False
        async def safe_send(message):
            nonlocal started
            if message['type']=='http.response.start':
                started=True
            await send(message)
        try:
            if scope['method'] in ('POST','PUT','PATCH') and scope['path'].startswith('/api/'):
                headers=dict(scope.get('headers',[]))
                content_type=headers.get(b'content-type',b'').split(b';')[0].strip().lower()
                if content_type != b'application/json':
                    return await response(415,'unsupported_media_type','Send JSON content.')(scope,receive,send)
                try:
                    declared=int(headers.get(b'content-length',b'0'))
                    if declared<0: raise ValueError()
                except ValueError:
                    return await response(400,'invalid_length','Invalid request length.')(scope,receive,send)
                if declared>self.max_bytes:
                    return await response(413,'body_too_large','Submission is too large.')(scope,receive,send)
                chunks=[];size=0
                while True:
                    message=await receive()
                    if message['type']=='http.disconnect':
                        return
                    chunk=message.get('body',b'');size+=len(chunk)
                    if size>self.max_bytes:
                        return await response(413,'body_too_large','Submission is too large.')(scope,receive,send)
                    chunks.append(chunk)
                    if not message.get('more_body',False): break
                raw=b''.join(chunks); delivered=False
                original_receive=receive
                async def bounded_receive():
                    nonlocal delivered
                    if not delivered:
                        delivered=True
                        return {'type':'http.request','body':raw,'more_body':False}
                    return await original_receive()
                receive=bounded_receive
            await self.app(scope,receive,safe_send)
        except Exception as exc:
            log.error('unexpected_request_failure',extra={'error_class':type(exc).__name__})
            if started:
                raise RuntimeError('Response interrupted') from None
            await response(500,'internal_error','The submission could not be completed. Please retry.')(scope,receive,send)

class RuntimeCORSMiddleware:
    def __init__(self,app,settings_getter):
        self.app=app;self.settings_getter=settings_getter;self.cors=None
    async def __call__(self,scope,receive,send):
        if scope['type']!='http':
            return await self.app(scope,receive,send)
        if self.cors is None:
            self.cors=CORSMiddleware(self.app,allow_origins=list(self.settings_getter().cors_origins),
                allow_credentials=False,allow_methods=['GET','POST'],
                allow_headers=['Content-Type','Idempotency-Key'],expose_headers=['Retry-After'])
        return await self.cors(scope,receive,send)
