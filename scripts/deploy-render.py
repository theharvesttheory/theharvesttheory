#!/usr/bin/env python3
"""Explicitly authorized releases only. Never log hook URLs, credentials or bodies."""
import argparse
from datetime import datetime, timezone
import json
import logging
import os
import re
import sys
import time
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
import httpx

for logger in ('httpx','httpcore'):
    logging.getLogger(logger).disabled=True

def validate(env,sha):
    if not re.fullmatch('[0-9a-f]{40}',sha):raise ValueError('Exact tested SHA required')
    service=env.get('RENDER_SERVICE_ID','')
    if not re.fullmatch(r'srv-[a-z0-9]+',service):raise ValueError('Render service ID required')
    if env.get('RENDER_PLAN') not in ('starter','standard','pro','pro_plus','pro_max','pro_ultra'):raise ValueError('Approved always-on Render plan required')
    if not env.get('RENDER_API_TOKEN'):raise ValueError('Render API token required')
    hook=urlsplit(env.get('RENDER_DEPLOY_HOOK_URL',''));query=dict(parse_qsl(hook.query))
    if hook.scheme!='https' or hook.netloc!='api.render.com' or hook.path!=f'/deploy/{service}' or hook.fragment or not query.get('key') or set(query)-{'key','ref'}:raise ValueError('Invalid Render deploy hook')
    api=urlsplit(env.get('PUBLIC_API_URL',''))
    if api.scheme!='https' or not api.hostname or api.username or api.password or api.query or api.fragment or api.path not in ('','/') or api.hostname in ('localhost','127.0.0.1') or api.hostname.endswith(('.test','.invalid','.example')):raise ValueError('Public HTTPS API origin required')
    query['ref']=sha
    return service,urlunsplit((hook.scheme,hook.netloc,hook.path,urlencode(query),'')),env['PUBLIC_API_URL'].rstrip('/')

def request(client,method,url,**kwargs):
    try:
        response=client.request(method,url,timeout=10,follow_redirects=False,**kwargs)
    except httpx.HTTPError:
        raise ValueError('Deployment HTTP request failed; inspect provider dashboard before retrying') from None
    return response

def json_response(response):
    if response.status_code!=200:raise ValueError('Deployment API rejected the request')
    try:return response.json()
    except ValueError:raise ValueError('Deployment API returned invalid JSON') from None

def ready(client,api,sha):
    try:
        version=request(client,'GET',api+'/api/version')
        health=request(client,'GET',api+'/api/health/ready')
        return version.status_code==200 and version.json().get('sha')==sha and health.status_code==200
    except (ValueError,AttributeError):return False

def deploy(env,sha,*,client,timeout=1200,interval=5,monotonic=time.monotonic,sleep=time.sleep,now=lambda:datetime.now(timezone.utc)):
    service,hook,api=validate(env,sha)
    if not 0<timeout<=1800 or not 0<interval<=30:raise ValueError('Invalid deployment polling bounds')
    started=now();deadline=monotonic()+timeout
    response=request(client,'POST',hook)
    if response.status_code not in (200,202):raise ValueError('Render hook rejected deployment')
    deploy_id=None
    if response.status_code==200:
        body=json_response(response);deploy_id=body.get('deploy',{}).get('id')
        if not isinstance(deploy_id,str) or not re.fullmatch(r'dep-[a-zA-Z0-9]+',deploy_id):raise ValueError('Render hook did not identify deployment')
    headers={'Authorization':'Bearer '+env['RENDER_API_TOKEN']}
    endpoint=f'https://api.render.com/v1/services/{service}/deploys'
    while monotonic()<deadline:
        if deploy_id is None:
            items=json_response(request(client,'GET',endpoint,headers=headers,params={'limit':100,'createdAfter':started.isoformat()}))
            if not isinstance(items,list):raise ValueError('Unexpected deployment list')
            for item in items:
                candidate=item.get('deploy',{})
                try:created=datetime.fromisoformat(candidate.get('createdAt','').replace('Z','+00:00'))
                except (ValueError,TypeError):continue
                if created.tzinfo and created>=started and candidate.get('commit',{}).get('id')==sha:
                    value=candidate.get('id','')
                    if re.fullmatch(r'dep-[a-zA-Z0-9]+',value):deploy_id=value;break
        if deploy_id:
            detail=json_response(request(client,'GET',endpoint+'/'+deploy_id,headers=headers))
            if detail.get('commit',{}).get('id')!=sha:raise ValueError('Render deployment commit does not match tested SHA')
            status=detail.get('status')
            if status in ('build_failed','update_failed','pre_deploy_failed','canceled','deactivated'):raise ValueError('Render deployment failed or was superseded')
            if status=='live' and ready(client,api,sha):return {'sha':sha,'deploy_id':deploy_id,'service_id':service,'ready':True}
        sleep(interval)
    raise TimeoutError('Timed out waiting for matching Render deployment and API readiness')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--sha',required=True);parser.add_argument('--dry-run',action='store_true');args=parser.parse_args()
    validate(os.environ,args.sha)
    if args.dry_run:print(json.dumps({'sha':args.sha,'validated':True,'deployment_triggered':False}));return
    with httpx.Client() as client:print(json.dumps(deploy(os.environ,args.sha,client=client)))
if __name__=='__main__':
    try:main()
    except (ValueError,TimeoutError,KeyError,TypeError,AttributeError):
        print('Render release rejected; inspect configuration or provider deployment status (credentials redacted).',file=sys.stderr);sys.exit(1)
