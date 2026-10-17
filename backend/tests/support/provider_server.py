"""Loopback-only notification simulator. Captures are private synthetic test artifacts."""
import argparse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
import time
from uuid import uuid5, NAMESPACE_URL

LOCK=threading.Lock()
def validate_bind(host):
    if host not in ('127.0.0.1','localhost','::1'):raise ValueError('Simulator must bind loopback')

def serve(host,port,directory):
    validate_bind(host);directory=Path(directory);directory.mkdir(parents=True,exist_ok=True,mode=0o700)
    accepted=set()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def reply(self,status,body,headers=None):
            data=json.dumps(body).encode();self.send_response(status)
            self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)))
            for key,value in (headers or {}).items():self.send_header(key,value)
            self.end_headers()
            try:self.wfile.write(data)
            except (BrokenPipeError,ConnectionResetError):pass
        def do_GET(self):
            self.reply(200 if self.path=='/health' else 404,{'status':'simulator'})
        def do_POST(self):
            channel=self.path.lstrip('/')
            if channel not in ('ops_email','confirmation_email','slack'):return self.reply(404,{})
            try:
                size=int(self.headers.get('Content-Length','0'))
                if not 0<size<=100000:return self.reply(413,{})
                body=json.loads(self.rfile.read(size));job_id=body['job_id'];payload=body['payload']
                if not isinstance(job_id,str) or not isinstance(payload,dict):raise ValueError()
            except (ValueError,KeyError,TypeError):return self.reply(400,{})
            faults=directory/'faults.json'
            try:control=json.loads(faults.read_text()).get(channel,{}) if faults.exists() else {}
            except (ValueError,OSError):return self.reply(503,{})
            status=int(control.get('status',200));provider_id='fake-'+str(uuid5(NAMESPACE_URL,job_id))
            with LOCK:
                duplicate=channel!='slack' and job_id in accepted
                if status==200:accepted.add(job_id)
                event={'at':datetime.now(timezone.utc).isoformat(),'channel':channel,'job_id':job_id,
                       'payload':payload,'status':status,'provider_id':provider_id,'deduplicated':duplicate}
                # No request headers or provider secrets are captured. Test identities/links
                # remain local in a mode-0600 artifact so browser tests can exercise them.
                with (directory/'captures.jsonl').open('a') as output:output.write(json.dumps(event)+'\n')
            time.sleep(min(15,max(0,float(control.get('delay',0)))))
            if control.get('disconnect'):
                self.close_connection=True;self.connection.close();return
            self.reply(status,{'id':provider_id}, {'Retry-After':str(control.get('retry_after',1))} if status==429 else {})
    server=ThreadingHTTPServer((host,port),Handler)
    try:server.serve_forever()
    finally:server.server_close()

if __name__=='__main__':
    import os
    os.umask(0o077)
    parser=argparse.ArgumentParser();parser.add_argument('--host',default='127.0.0.1');parser.add_argument('--port',type=int,required=True);parser.add_argument('--directory',required=True)
    args=parser.parse_args();serve(args.host,args.port,args.directory)
