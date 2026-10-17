#!/usr/bin/env python3
"""Fail-closed release gates. Dry runs do not publish or contact providers."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
import httpx

def load(name,filename):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(filename));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
release=load('release_config','check-release-config.py')
static=load('static_checker','check-static-artifact.py')
render=load('render_deploy','deploy-render.py')

def https_origin(value):
    p=urlsplit(value)
    if p.scheme!='https' or not p.hostname or p.username or p.password or p.path not in ('','/') or p.query or p.fragment or p.hostname in ('localhost','127.0.0.1') or p.hostname.endswith(('.test','.example','.invalid')):raise ValueError('Real HTTPS origin required')
    return value.rstrip('/')

def preflight(env):
    if env.get('DEPLOYMENT_ENABLED')!='true' or env.get('GITHUB_REF')!='refs/heads/main':raise ValueError('Release is disabled or branch is not main')
    for key in ('PUBLIC_API_URL','PUBLIC_FRONTEND_URL','REACT_APP_BACKEND_URL','REACT_APP_TURNSTILE_SITE_KEY','REACT_APP_TURNSTILE_MODE','RENDER_SERVICE_ID','RENDER_PLAN','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_PAGES_PROJECT'):
        if not env.get(key):raise ValueError('Missing production variable: '+key)
    api=https_origin(env['PUBLIC_API_URL']);https_origin(env['PUBLIC_FRONTEND_URL'])
    if env['REACT_APP_BACKEND_URL'].rstrip('/')!=api:raise ValueError('Frontend and backend API origins differ')
    if not re.fullmatch('[a-f0-9]{32}',env['CLOUDFLARE_ACCOUNT_ID']) or not re.fullmatch('[a-z0-9][a-z0-9-]{0,57}[a-z0-9]',env['CLOUDFLARE_PAGES_PROJECT']):raise ValueError('Invalid Cloudflare project/account')
    if not re.fullmatch('srv-[a-z0-9]+',env['RENDER_SERVICE_ID']) or env['RENDER_PLAN'] not in ('starter','standard','pro','pro_plus','pro_max','pro_ultra'):raise ValueError('Approved always-on Render service required')
    return release.public_config(env,'production')

def verify_artifact(build,sha,config):
    manifest=json.loads((Path(build)/'release-manifest.json').read_text())
    release.verify_manifest(build,manifest,sha,config)
    static.check_artifact(build,config['target'])
    return manifest

def verify_backend(client,api,sha):
    https_origin(api)
    if not render.ready(client,api.rstrip('/'),sha):raise ValueError('Backend version or readiness did not pass')
    return {'sha':sha,'ready':True}

def smoke(client,frontend,build):
    base=https_origin(frontend);build=Path(build);manifest=json.loads((build/'release-manifest.json').read_text())
    def get(path):
        try:r=client.get(base+path,timeout=15,follow_redirects=False)
        except httpx.HTTPError:raise ValueError('Frontend smoke request failed') from None
        if r.status_code!=200:raise ValueError('Frontend smoke returned an unsuccessful status')
        return r
    remote=get('/release-manifest.json')
    if remote.json()!=manifest:raise ValueError('Remote artifact manifest differs from tested release')
    index=(build/'index.html').read_bytes()
    for path in ('/','/contact','/products/root-and-leaf','/journal/lopchu-a-cup-with-a-sense-of-place','/privacy','/newsletter/confirm','/newsletter/unsubscribe'):
        r=get(path)
        if r.content!=index:raise ValueError('Deep link did not serve tested SPA')
        if r.headers.get('x-content-type-options')!='nosniff' or r.headers.get('referrer-policy')!='no-referrer' or "frame-ancestors 'none'" not in r.headers.get('content-security-policy',''):raise ValueError('Frontend security headers missing')
        if path.startswith('/newsletter/') and ('no-store' not in r.headers.get('cache-control','') or 'noindex' not in r.headers.get('x-robots-tag','')):raise ValueError('Action route caching/indexing headers missing')
    # Pages consumes _headers/_redirects as configuration; they are not public files.
    for path,checksum in manifest['files'].items():
        if path.endswith(('.js','.css')):
            if hashlib.sha256(get('/'+path).content).hexdigest()!=checksum:raise ValueError('Remote static asset differs from tested artifact')
    return {'sha':manifest['sha'],'artifact_sha256':manifest['artifact_sha256'],'smoke_passed':True}

def main():
    p=argparse.ArgumentParser();p.add_argument('--phase',choices=['preflight','artifact','backend','smoke','dry-run'],required=True);p.add_argument('--sha',required=True);p.add_argument('--build',type=Path,default=Path('frontend/build'));p.add_argument('--target',choices=['local','production'],default='production');args=p.parse_args()
    if args.phase!='dry-run' and args.target!='production':raise ValueError('Publishing requires production target')
    config=release.public_config(os.environ,args.target) if args.phase=='dry-run' else preflight(os.environ)
    if not re.fullmatch('[0-9a-f]{40}',args.sha):raise ValueError('Exact tested commit required')
    result={'sha':args.sha,'phase':args.phase}
    if args.phase in ('artifact','dry-run','smoke'):
        manifest=verify_artifact(args.build,args.sha,config);result['artifact_sha256']=manifest['artifact_sha256']
    if args.phase=='dry-run':result.update({'deployment_triggered':False,'provider_http_requests':0})
    if args.phase in ('backend','smoke'):
        with httpx.Client() as client:
            result.update(verify_backend(client,os.environ['PUBLIC_API_URL'],args.sha))
            if args.phase=='smoke':result.update(smoke(client,os.environ['PUBLIC_FRONTEND_URL'],args.build))
    print(json.dumps(result))
if __name__=='__main__':
    try:main()
    except Exception:
        print('Release verification failed; check public configuration, tested artifact and deployment status. No secret values are logged.',file=sys.stderr);sys.exit(1)
