#!/usr/bin/env python3
"""Own an isolated local stack without stopping unrelated processes."""
import argparse
import fcntl
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import time
from urllib.parse import urlsplit
from urllib.request import build_opener, ProxyHandler
from uuid import uuid4

ROOT=Path(__file__).resolve().parents[1]

def process_command(pid):
    return subprocess.run(['ps','-p',str(pid),'-o','command='],capture_output=True,text=True).stdout.strip()

def ensure_ports_free(ports):
    if len(set(ports))!=len(ports):raise ValueError('Stack ports must be distinct')
    for port in ports:
        if not 1024<=port<=65535:raise ValueError('Invalid local port')
        with socket.socket() as probe:
            try:probe.bind(('127.0.0.1',port))
            except OSError:
                details=subprocess.run(['lsof','-nP',f'-iTCP:{port}','-sTCP:LISTEN'],capture_output=True,text=True).stdout if sys.platform=='darwin' else 'Inspect the listener with ss -ltnp.'
                raise RuntimeError(f'Port {port} is occupied; existing process preserved. {details}') from None

def validate_mongo_url(url):
    p=urlsplit(url)
    if p.scheme!='mongodb' or p.hostname not in ('127.0.0.1','localhost','::1') or p.username or p.password or ',' in p.netloc:
        raise ValueError('Local stack requires unauthenticated loopback Mongo')
    return url

def check_mongo(url):
    from pymongo import MongoClient
    validate_mongo_url(url)
    try:
        with MongoClient(url,serverSelectionTimeoutMS=700,connectTimeoutMS=700) as client:client.admin.command('ping')
    except Exception:raise RuntimeError('Mongo is unavailable; start a dedicated local/CI Mongo server first') from None

def write_state(path,state):
    temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(state,indent=2));temporary.replace(path)

def stop_owned(state):
    pid=state['supervisor_pid'];command=process_command(pid)
    if 'run-local.py' not in command or 'supervise' not in command or state['token'] not in command:
        raise RuntimeError('Process ownership could not be verified; no signal sent')
    os.kill(pid,signal.SIGTERM)

def wait_url(url,timeout=1):
    try:
        with build_opener(ProxyHandler({})).open(url,timeout=timeout) as response:return response.status==200
    except Exception:return False

def supervise(args):
    path=Path(args.state);state=json.loads(path.read_text())
    if state['token']!=args.token:raise RuntimeError('Invalid supervisor ownership token')
    stopped=False;children=[];logs=[]
    def stop(*unused):
        nonlocal stopped
        stopped=True
    signal.signal(signal.SIGTERM,stop);signal.signal(signal.SIGINT,stop)
    directory=Path(state['directory']);api=state['api_port'];front=state['frontend_port'];provider=state['provider_port']
    env={**os.environ,'APP_ENV':'test','APP_GIT_SHA':state['sha'],'MONGO_URL':state['mongo_url'],'DB_NAME':state['database'],
         'CORS_ORIGINS':f'http://127.0.0.1:{front},http://localhost:{front}','PUBLIC_FRONTEND_URL':f'http://127.0.0.1:{front}',
         'NOTIFICATION_MODE':'fake','BOT_MODE':'fake','LOCAL_PROVIDER_BASE_URL':f'http://127.0.0.1:{provider}',
         'WORKER_ENABLED':'true','IP_RATE_LIMIT':'500','GLOBAL_RATE_LIMIT':'5000','POLL_SECONDS':'0.5',
         'RESEND_API_KEY':'','SLACK_WEBHOOK_URL':'','TURNSTILE_SECRET_KEY':'','TRUSTED_PROXY_CIDRS':'',
         'SENDER_EMAIL':'harvest@example.test','NOTIFY_EMAILS':'team@example.test','SUPPORT_EMAIL':'team@example.test',
         'NEWSLETTER_SIGNING_KEY':'local-only-'+state['token'],'RATE_LIMIT_HMAC_KEY':'local-only-rate-'+state['token'],
         'REACT_APP_BACKEND_URL':f'http://127.0.0.1:{api}','REACT_APP_TURNSTILE_MODE':'fake',
         'REACT_APP_TURNSTILE_SITE_KEY':'local-test-site-key','HOST':'127.0.0.1','PORT':str(front),'BROWSER':'none'}
    env.pop('RENDER',None)
    def launch(name,command,cwd=ROOT):
        log=(directory/f'{name}.log').open('a');logs.append(log)
        child=subprocess.Popen(command,cwd=cwd,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
        children.append(child);state['children'][name]=child.pid;write_state(path,state)
    try:
        launch('provider',[sys.executable,str(ROOT/'backend/tests/support/provider_server.py'),'--port',str(provider),'--directory',str(directory)])
        launch('api',[sys.executable,'-m','uvicorn','server:app','--app-dir','backend','--host','127.0.0.1','--port',str(api),'--workers','1','--no-proxy-headers','--no-access-log'])
        if state['frontend_mode']=='build':
            launch('frontend',[sys.executable,str(Path(__file__).resolve()),'serve-static','--port',str(front)])
        else:
            node_version=subprocess.check_output(['node','--version'],text=True).strip()
            prefix=['node'] if node_version.startswith('v22.') else ['npm','exec','--yes','--package=node@22','--','node']
            launch('frontend',prefix+['node_modules/@craco/craco/dist/bin/craco.js','start'],ROOT/'frontend')
        started=time.monotonic()
        while not stopped:
            if any(child.poll() is not None for child in children):raise RuntimeError('A stack child exited; inspect private local logs')
            if state['status']=='starting':
                ready=all(wait_url(url) for url in [f'http://127.0.0.1:{provider}/health',f'http://127.0.0.1:{api}/api/health/ready',f'http://127.0.0.1:{front}/'])
                if ready:state['status']='running';write_state(path,state)
                elif time.monotonic()-started>90:raise RuntimeError('Local stack readiness timed out')
            time.sleep(.2)
    except Exception as exc:
        state['error']=str(exc);state['status']='failed'
    finally:
        for child in children:
            if child.poll() is None:os.killpg(child.pid,signal.SIGTERM)
        deadline=time.monotonic()+15
        for child in children:
            try:child.wait(timeout=max(.1,deadline-time.monotonic()))
            except subprocess.TimeoutExpired:
                os.killpg(child.pid,signal.SIGKILL);child.wait()
        for log in logs:log.close()
        if state['status']!='failed':state['status']='stopped'
        write_state(path,state)

def start(args,path):
    if path.exists():
        prior=json.loads(path.read_text())
        if prior.get('status') in ('running','starting') and prior['token'] in process_command(prior.get('supervisor_pid',0)):
            raise RuntimeError('This profile is already running')
    ports=[args.frontend_port,args.api_port,args.provider_port];ensure_ports_free(ports)
    mongo=validate_mongo_url(os.environ.get('TEST_MONGO_URL','mongodb://127.0.0.1:27017'));check_mongo(mongo)
    if args.frontend_mode=='build' and not (ROOT/'frontend/build/index.html').is_file():raise RuntimeError('Build the local release bundle first')
    token=uuid4().hex;directory=path.parent/token;directory.mkdir(parents=True,mode=0o700)
    sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    state={'token':token,'status':'starting','database':f'tht_local_{args.profile}_{token}',
           'mongo_url':mongo,'directory':str(directory),'frontend_port':ports[0],'api_port':ports[1],
           'provider_port':ports[2],'frontend_mode':args.frontend_mode,'children':{},'sha':sha}
    write_state(path,state)
    with (directory/'supervisor.log').open('a') as log:
        process=subprocess.Popen([sys.executable,str(Path(__file__).resolve()),'supervise','--state',str(path),'--token',token],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
    # Only the caller adds the supervisor PID; supervisor waits for this handshake.
    state['supervisor_pid']=process.pid;write_state(path,state)
    deadline=time.monotonic()+95
    while time.monotonic()<deadline:
        current=json.loads(path.read_text())
        if current['status']=='running':print(json.dumps(current,indent=2));return
        if current['status']=='failed' or process.poll() is not None:raise RuntimeError(current.get('error','Supervisor exited; inspect its local log'))
        time.sleep(.2)
    stop_owned(state);raise RuntimeError('Local startup timed out')

def serve_static(port):
    root=ROOT/'frontend/build'
    class SPA(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
        def do_GET(self):
            if not Path(self.translate_path(self.path)).is_file() and '.' not in Path(urlsplit(self.path).path).name:self.path='/index.html'
            super().do_GET()
    ThreadingHTTPServer(('127.0.0.1',port),partial(SPA,directory=str(root))).serve_forever()

def main():
    os.umask(0o077)
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=['start','stop','status','supervise','serve-static'])
    parser.add_argument('--profile',choices=['test','local'],default='test');parser.add_argument('--frontend-port',type=int,default=4300);parser.add_argument('--api-port',type=int,default=8300);parser.add_argument('--provider-port',type=int,default=8301)
    parser.add_argument('--frontend-mode',choices=['dev','build'],default='dev');parser.add_argument('--state');parser.add_argument('--token');parser.add_argument('--port',type=int)
    args=parser.parse_args()
    if args.command=='supervise':
        # Parent atomically writes its PID before the child starts mutating state.
        for unused in range(100):
            if json.loads(Path(args.state).read_text()).get('supervisor_pid')==os.getpid():break
            time.sleep(.02)
        return supervise(args)
    if args.command=='serve-static':return serve_static(args.port)
    path=ROOT/'.local'/args.profile/'state.json';path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    if args.command=='start':
        with (path.parent/'launch.lock').open('a') as lock:
            try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
            except BlockingIOError:raise RuntimeError('Another launcher owns this profile') from None
            return start(args,path)
    if not path.exists():raise RuntimeError('No owned stack exists for this profile')
    state=json.loads(path.read_text())
    if args.command=='status':print(json.dumps(state,indent=2));return
    if state['status'] in ('stopped','failed'):print('Stack is already stopped');return
    stop_owned(state)
    deadline=time.monotonic()+20
    while time.monotonic()<deadline:
        current=json.loads(path.read_text())
        if current['status'] in ('stopped','failed'):print('Owned stack stopped; database and private evidence retained');return
        time.sleep(.2)
    raise RuntimeError('Shutdown not confirmed; inspect the owned supervisor')

if __name__=='__main__':
    try:main()
    except Exception as exc:print(f'Local stack: {exc}',file=sys.stderr);sys.exit(1)
