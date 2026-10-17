import importlib.util
import json
from pathlib import Path
import httpx
import pytest
from test_release_config import helper as config_helper,ROOT

def helper():
    spec=importlib.util.spec_from_file_location('verify_release',ROOT/'scripts/verify-release.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

ENV={'DEPLOYMENT_ENABLED':'true','GITHUB_REF':'refs/heads/main','PUBLIC_API_URL':'https://harvest-fixture.onrender.com','PUBLIC_FRONTEND_URL':'https://harvest-fixture.pages.dev','REACT_APP_BACKEND_URL':'https://harvest-fixture.onrender.com','REACT_APP_TURNSTILE_SITE_KEY':'0x4AAAA-owner-key','REACT_APP_TURNSTILE_MODE':'live','RENDER_SERVICE_ID':'srv-fixture','RENDER_PLAN':'starter','CLOUDFLARE_ACCOUNT_ID':'a'*32,'CLOUDFLARE_PAGES_PROJECT':'harvest-fixture'}

def test_missing_production_variables_and_wrong_branch_block_before_network(tmp_path,monkeypatch):
    m=helper()
    launch=tmp_path/'frontend/src/data/launch-config.json';launch.parent.mkdir(parents=True);launch.write_text('{}');monkeypatch.setattr(m.release,'ROOT',tmp_path)
    for field in ENV:
        with pytest.raises(ValueError):m.preflight({**ENV,field:''})
    with pytest.raises(ValueError):m.preflight({**ENV,'GITHUB_REF':'refs/heads/feature'})
    # Repository owner approvals are intentionally false until activation.
    with pytest.raises(ValueError,match='Owner approvals'):m.preflight(ENV)

def test_artifact_rejects_wrong_sha_config_and_changed_bytes(tmp_path):
    m=helper();c=config_helper();config=c.public_config({'REACT_APP_BACKEND_URL':'http://127.0.0.1:8300','REACT_APP_TURNSTILE_SITE_KEY':'local-test-site-key','REACT_APP_TURNSTILE_MODE':'live'},'local')
    from test_static_artifact_checks import fixture_build
    fixture_build(tmp_path)
    assert m.verify_artifact(tmp_path,'a'*40,config)['sha']=='a'*40
    with pytest.raises(ValueError):m.verify_artifact(tmp_path,'b'*40,config)
    with pytest.raises(ValueError):m.verify_artifact(tmp_path,'a'*40,{**config,'api_url':'http://localhost:8300'})
    (tmp_path/'main.js').write_text('changed')
    with pytest.raises(ValueError):m.verify_artifact(tmp_path,'a'*40,config)

@pytest.mark.parametrize('fault',['old_sha','not_ready','network'])
def test_backend_gate_rejects_old_unready_or_unreachable(fault):
    m=helper()
    def handler(request):
        if fault=='network':raise httpx.ConnectError('private transport detail')
        return httpx.Response(503 if fault=='not_ready' else 200,json={'sha':'b'*40 if fault=='old_sha' else 'a'*40})
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(ValueError):m.verify_backend(client,ENV['PUBLIC_API_URL'],'a'*40)

@pytest.mark.parametrize('fault',[None,'page','asset','manifest','headers'])
def test_smoke_requires_deep_links_headers_and_exact_remote_bytes(tmp_path,fault):
    from test_static_artifact_checks import fixture_build
    fixture_build(tmp_path);manifest=json.loads((tmp_path/'release-manifest.json').read_text());m=helper()
    def handler(request):
        path=request.url.path
        if path=='/release-manifest.json':return httpx.Response(200,json={} if fault=='manifest' else manifest)
        if path in ('/main.js','/_headers','/_redirects'):
            return httpx.Response(200,content=b'changed' if fault=='asset' else (tmp_path/path.lstrip('/')).read_bytes())
        return httpx.Response(404 if fault=='page' else 200,content=(tmp_path/'index.html').read_bytes(),headers={} if fault=='headers' else {'x-content-type-options':'nosniff','referrer-policy':'no-referrer','cache-control':'no-store','x-robots-tag':'noindex','content-security-policy':"frame-ancestors 'none'"})
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        if fault:
            with pytest.raises(ValueError):m.smoke(client,ENV['PUBLIC_FRONTEND_URL'],tmp_path)
        else:assert m.smoke(client,ENV['PUBLIC_FRONTEND_URL'],tmp_path)['sha']=='a'*40


def test_complete_public_preflight_accepts_explicit_owner_approved_fixture(tmp_path,monkeypatch):
    m=helper();path=tmp_path/'frontend/src/data/launch-config.json';path.parent.mkdir(parents=True)
    path.write_text(json.dumps({'businessApproved':True,'privacyApproved':True,'retentionApproved':True,'ownerName':'Fixture Owner','ownerAddress':'Fixture Address','privacyEmail':'privacy@fixture.org','supportEmail':'support@fixture.org','suppressionPolicy':'Reviewed minimal suppression policy'}))
    monkeypatch.setattr(m.release,'ROOT',tmp_path)
    config=m.preflight(ENV)
    assert config['target']=='production' and config['api_url']==ENV['PUBLIC_API_URL']
