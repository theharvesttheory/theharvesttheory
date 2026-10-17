import importlib.util
import json
from pathlib import Path
import pytest
from test_release_config import helper,ROOT

def checker():
    spec=importlib.util.spec_from_file_location('static_checker',ROOT/'scripts/check-static-artifact.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def fixture_build(path):
    m=helper();config=m.public_config({'REACT_APP_BACKEND_URL':'http://127.0.0.1:8300','REACT_APP_TURNSTILE_SITE_KEY':'local-test-site-key','REACT_APP_TURNSTILE_MODE':'live'},'local')
    (path/'index.html').write_text('<script src="/main.js"></script>')
    (path/'main.js').write_text('http://127.0.0.1:8300 local-test-site-key')
    (path/'_headers').write_text("/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Content-Security-Policy: default-src 'self'; connect-src 'self' http://127.0.0.1:8300; frame-ancestors 'none'\n")
    (path/'_redirects').write_text('# Pages native SPA fallback; no top-level 404.html\n')
    def manifest():
        (path/'release-manifest.json').write_text(json.dumps(m.create_manifest(path,'a'*40,config)))
    manifest();return manifest

def test_local_static_artifact_and_production_gate(tmp_path):
    fixture_build(tmp_path);assert checker().check_artifact(tmp_path,'local')['sha']=='a'*40
    with pytest.raises(ValueError):checker().check_artifact(tmp_path,'production')

@pytest.mark.parametrize('fault',['secret','env','missing_asset','wrong_bundle','placeholder','404'])
def test_bad_artifacts_are_rejected_even_when_manifest_is_self_consistent(tmp_path,fault):
    manifest=fixture_build(tmp_path)
    if fault=='secret':(tmp_path/'leak.js').write_text('https://hooks.slack.com/services/PRIVATE/SECRET')
    if fault=='env':(tmp_path/'.env').write_text('PRIVATE=value')
    if fault=='missing_asset':(tmp_path/'index.html').write_text('<script src="/missing.js"></script>')
    if fault=='wrong_bundle':(tmp_path/'main.js').write_text('https://unrelated.example.test WRONG_KEY')
    if fault=='placeholder':(tmp_path/'_headers').write_text('__PUBLIC_API_ORIGIN__')
    if fault=='404':(tmp_path/'404.html').write_text('No SPA fallback')
    manifest()
    with pytest.raises(ValueError):checker().check_artifact(tmp_path,'local')
