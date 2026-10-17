#!/usr/bin/env python3
"""Validate a Pages artifact without uploading or contacting a provider."""
import argparse
from html.parser import HTMLParser
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
spec=importlib.util.spec_from_file_location('release_config',Path(__file__).with_name('check-release-config.py'))
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)

class Assets(HTMLParser):
    def __init__(self):super().__init__();self.paths=[]
    def handle_starttag(self,tag,attributes):
        for name,value in attributes:
            if name in ('src','href') and value and value.startswith('/') and not value.startswith('//'):self.paths.append(urlsplit(value).path)

def check_artifact(build,target):
    build=Path(build);manifest=json.loads((build/'release-manifest.json').read_text());config=manifest['public_config']
    if config['target']!=target:raise ValueError('Artifact target mismatch')
    expected=release.public_config({'REACT_APP_BACKEND_URL':config['api_url'],'REACT_APP_TURNSTILE_SITE_KEY':config['turnstile_site_key'],'REACT_APP_TURNSTILE_MODE':config['turnstile_mode']},target)
    release.verify_manifest(build,manifest,manifest['sha'],expected)
    if (build/'404.html').exists():raise ValueError('Top-level 404 disables the intended Pages SPA fallback')
    headers=(build/'_headers').read_text();redirects=(build/'_redirects').read_text()
    for required in ('X-Content-Type-Options: nosniff','Referrer-Policy: no-referrer',"frame-ancestors 'none'",config['api_url']):
        if required not in headers:raise ValueError('Missing required static header configuration')
    if '__PUBLIC_API_ORIGIN__' in headers or re.search(r'^/\*\s+/index.html',redirects,re.M):raise ValueError('Unresolved or asset-shadowing routing configuration')
    parser=Assets();parser.feed((build/'index.html').read_text())
    for asset in parser.paths:
        candidate=(build/asset.lstrip('/')).resolve()
        if build.resolve() not in candidate.parents or not candidate.is_file():raise ValueError('Referenced static asset is missing')
    javascript=[]
    secrets=[os.environ.get(key,'') for key in ('RESEND_API_KEY','SLACK_WEBHOOK_URL','MONGO_URL','TURNSTILE_SECRET_KEY','NEWSLETTER_SIGNING_KEY','RATE_LIMIT_HMAC_KEY','RENDER_API_TOKEN','CLOUDFLARE_API_TOKEN')]
    for path in build.rglob('*'):
        if not path.is_file():continue
        if path.name.startswith('.env') or path.suffix=='.pem':raise ValueError('Sensitive file in public artifact')
        if path.suffix not in ('.js','.json','.html','.css','.map') and path.name not in ('_headers','_redirects'):continue
        text=path.read_text(errors='replace')
        if any(value and len(value)>=12 and value in text for value in secrets):raise ValueError('Configured secret value found in public artifact')
        if re.search(r'mongodb(?:\+srv)?://[^\s"\x27]+@|hooks\.slack\.com/services/|\bre_[A-Za-z0-9_]{20,}\b|BEGIN (?:RSA |EC )?PRIVATE KEY',text):raise ValueError('Provider credential pattern found in public artifact')
        if path.suffix=='.js':javascript.append(text)
    bundle='\n'.join(javascript)
    if config['api_url'] not in bundle or config['turnstile_site_key'] not in bundle:raise ValueError('Manifest public settings do not match the baked bundle')
    return {'sha':manifest['sha'],'artifact_sha256':manifest['artifact_sha256'],'target':target}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--build',type=Path,required=True);parser.add_argument('--target',choices=['local','production'],required=True);args=parser.parse_args()
    print(json.dumps(check_artifact(args.build,args.target)))
if __name__=='__main__':
    try:main()
    except Exception as exc:print(f'Static artifact rejected: {exc}',file=sys.stderr);sys.exit(1)
