import importlib.util
from pathlib import Path
from datetime import datetime, timezone
import httpx
import pytest
from test_config import production_env
ROOT=Path(__file__).resolve().parents[2]
SHA='a'*40
ENV={'RENDER_SERVICE_ID':'srv-localfixture','RENDER_DEPLOY_HOOK_URL':'https://api.render.com/deploy/srv-localfixture?key=private-fixture','RENDER_API_TOKEN':'private-api-fixture','PUBLIC_API_URL':'https://harvest-fixture.onrender.com','RENDER_PLAN':'starter'}

def helper():
    spec=importlib.util.spec_from_file_location('render_deploy',ROOT/'scripts/deploy-render.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

class Clock:
    value=0
    def monotonic(self):return self.value
    def sleep(self,n):self.value+=n

def run(handler,env=None,timeout=30):
    m=helper();clock=Clock()
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        return m.deploy(env or ENV,SHA,client=client,timeout=timeout,interval=1,monotonic=clock.monotonic,sleep=clock.sleep,now=lambda:datetime(2026,10,17,tzinfo=timezone.utc))

@pytest.mark.parametrize('key,value',[('RENDER_SERVICE_ID',''),('RENDER_PLAN','unknown'),('RENDER_API_TOKEN',''),('PUBLIC_API_URL','http://localhost'),('RENDER_DEPLOY_HOOK_URL','https://evil.test/deploy/srv-localfixture?key=private-fixture')])
def test_invalid_config_makes_no_http_call(key,value):
    with pytest.raises(ValueError):run(lambda request:pytest.fail('No HTTP for invalid config'),{**ENV,key:value})

@pytest.mark.parametrize('queued',[False,True])
@pytest.mark.parametrize('plan',['free','starter'])
def test_hook_exact_sha_queued_discovery_and_readiness(queued,plan):
    seen=[]
    def handler(request):
        seen.append(request)
        if request.url.path.startswith('/deploy/'):
            assert request.url.params['ref']==SHA and request.url.params['key']=='private-fixture'
            assert 'authorization' not in request.headers
            return httpx.Response(202 if queued else 200,json={} if queued else {'deploy':{'id':'dep-fixture'}})
        if request.url.host=='api.render.com':
            assert request.headers['authorization']=='Bearer private-api-fixture'
            d={'id':'dep-fixture','commit':{'id':SHA},'status':'live','createdAt':'2026-10-17T00:00:01Z'}
            if request.url.path.endswith('/deploys'):
                return httpx.Response(200,json=[{'deploy':{**d,'id':'dep-old','createdAt':'2026-10-16T00:00:00Z'}},{'deploy':d}])
            assert request.url.path.endswith('/dep-fixture')
            return httpx.Response(200,json=d)
        assert 'authorization' not in request.headers
        return httpx.Response(200,json={'sha':SHA} if request.url.path.endswith('/version') else {'status':'ready'})
    result=run(handler,{**ENV,'RENDER_PLAN':plan})
    assert result['deploy_id']=='dep-fixture' and result['sha']==SHA
    assert seen[-1].url.path=='/api/health/ready'

@pytest.mark.parametrize('fault',['failed','timeout','old_sha','not_ready','wrong_deploy_sha','old_queued'])
@pytest.mark.parametrize('plan',['free','starter'])
def test_no_false_success(fault,plan):
    def handler(request):
        if request.url.path.startswith('/deploy/'):
            return httpx.Response(202 if fault=='old_queued' else 200,json={} if fault=='old_queued' else {'deploy':{'id':'dep-fixture'}})
        if request.url.host=='api.render.com':
            d={'id':'dep-fixture','commit':{'id':'b'*40 if fault=='wrong_deploy_sha' else SHA},'status':{'failed':'build_failed','timeout':'build_in_progress'}.get(fault,'live'),'createdAt':'2026-10-16T00:00:00Z'}
            return httpx.Response(200,json=[{'deploy':d}] if request.url.path.endswith('/deploys') else d)
        return httpx.Response(503 if fault=='not_ready' else 200,json={'sha':'b'*40 if fault=='old_sha' else SHA})
    with pytest.raises((ValueError,TimeoutError)):run(handler,{**ENV,'RENDER_PLAN':plan},timeout=3)

def test_render_commit_is_used_unless_explicitly_overridden():
    from config import Settings
    env=production_env();env.pop('APP_GIT_SHA');env['RENDER_GIT_COMMIT']=SHA
    assert Settings.from_env(env).app_git_sha==SHA
    assert Settings.from_env({**env,'APP_GIT_SHA':'b'*40}).app_git_sha=='b'*40
