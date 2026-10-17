#!/usr/bin/env python3
"""Public configuration and reproducible artifact identity; never collects secrets."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]

def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def public_config(env,target):
    if target not in ('local','production'):raise ValueError('Invalid target')
    api=env.get('REACT_APP_BACKEND_URL','').rstrip('/');key=env.get('REACT_APP_TURNSTILE_SITE_KEY','');mode=env.get('REACT_APP_TURNSTILE_MODE','')
    parsed=urlsplit(api)
    if not parsed.hostname or parsed.scheme not in ('http','https') or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment:raise ValueError('Invalid API origin')
    if mode!='live' or not key or len(key)>200 or re.search(r'\s',key):raise ValueError('Live widget public configuration required')
    launch=json.loads((ROOT/'frontend/src/data/launch-config.json').read_text())
    if target=='local':
        if parsed.hostname not in ('127.0.0.1','localhost','::1'):raise ValueError('Local target requires loopback API')
    else:
        if parsed.scheme!='https' or parsed.hostname in ('localhost','127.0.0.1','::1') or parsed.hostname.endswith(('.test','.example','.invalid')) or 'example.com' in parsed.hostname:raise ValueError('Production requires a real HTTPS API origin')
        if any(word in key.lower() for word in ('local','test','placeholder','example')):raise ValueError('Production requires a real public site key')
        if not all(launch.get(k) is True for k in ('businessApproved','privacyApproved','retentionApproved')):raise ValueError('Owner approvals pending')
        for field in ('ownerName','ownerAddress','privacyEmail','supportEmail','suppressionPolicy'):
            value=launch.get(field,'')
            if not isinstance(value,str) or not value.strip() or re.search(r'pending|placeholder|example\.|changeme',value,re.I):raise ValueError('Owner facts pending')
    return {'api_url':api,'turnstile_site_key':key,'turnstile_mode':mode,'target':target,'launch_config_sha256':digest(launch)}

def artifact_files(build):
    build=Path(build);result={}
    if not (build/'index.html').is_file():raise ValueError('Missing index.html')
    for path in sorted(build.rglob('*')):
        if path.is_symlink():raise ValueError('Symlinks are forbidden in release artifacts')
        if path.is_file() and path.name!='release-manifest.json':result[path.relative_to(build).as_posix()]=hashlib.sha256(path.read_bytes()).hexdigest()
    return result

def create_manifest(build,sha,config):
    if not re.fullmatch('[0-9a-f]{40}',sha):raise ValueError('Exact commit SHA required')
    files=artifact_files(build)
    return {'schema_version':1,'sha':sha,'public_config':config,'public_config_sha256':digest(config),'files':files,'artifact_sha256':digest(files)}

def verify_manifest(build,manifest,sha,config):
    expected=create_manifest(build,sha,config)
    if expected!=manifest:raise ValueError('Artifact SHA, public configuration or bytes differ from tested release')
    return expected

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--target',choices=['local','production'],required=True);parser.add_argument('--build',type=Path);parser.add_argument('--sha');parser.add_argument('--verify',action='store_true');args=parser.parse_args()
    config=public_config(os.environ,args.target)
    if args.build:
        if not args.sha:raise ValueError('SHA required with build')
        path=args.build/'release-manifest.json'
        if args.verify:manifest=verify_manifest(args.build,json.loads(path.read_text()),args.sha,config)
        else:manifest=create_manifest(args.build,args.sha,config);path.write_text(json.dumps(manifest,indent=2)+'\n')
        print(json.dumps({'sha':manifest['sha'],'public_config_sha256':manifest['public_config_sha256'],'artifact_sha256':manifest['artifact_sha256']}))
    else:print(json.dumps({'target':args.target,'public_config_sha256':digest(config)}))
if __name__=='__main__':
    try:main()
    except Exception as exc:print(f'Release configuration rejected: {exc}',file=sys.stderr);sys.exit(1)
