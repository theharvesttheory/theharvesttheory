"""Real worker and simulator processes sharing a test-owned Mongo namespace."""
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import socket
import subprocess
import sys
import time
from uuid import uuid4
import httpx
import pytest
from pymongo import MongoClient
from delivery_models import new_job

SUPPORT=Path(__file__).parent/'support'
NOW=datetime(2026,10,17,12,tzinfo=timezone.utc)

def wait_for(predicate,timeout=8):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        value=predicate()
        if value:return value
        time.sleep(.05)
    raise AssertionError('Expected recovery evidence was not observed before deadline')

@pytest.fixture
def simulator(tmp_path):
    with socket.socket() as probe:probe.bind(('127.0.0.1',0));port=probe.getsockname()[1]
    with (tmp_path/'provider.log').open('w') as log:
        process=subprocess.Popen([sys.executable,str(SUPPORT/'provider_server.py'),'--port',str(port),'--directory',str(tmp_path)],stdout=log,stderr=subprocess.STDOUT)
    def ready():
        try:return httpx.get(f'http://127.0.0.1:{port}/health',timeout=.2,trust_env=False).status_code==200
        except httpx.HTTPError:return False
    try:wait_for(ready);yield port
    finally:
        process.terminate();process.wait(timeout=5)

def spawn_worker(tmp_path,settings,port,crash=''):
    runner=SUPPORT/'recovery_worker.py';assert runner.exists(),'Missing subprocess recovery worker fixture'
    manifest=tmp_path/'worker.json';manifest.write_text(json.dumps({'mongo_url':settings.mongo_url,'database':settings.db_name,'provider':f'http://127.0.0.1:{port}','clock':str(tmp_path/'clock.json'),'crash':crash}))
    with (tmp_path/'worker.log').open('a') as log:return subprocess.Popen([sys.executable,str(runner),str(manifest)],stdout=log,stderr=subprocess.STDOUT)

def stop(process):
    if process.poll() is None:process.terminate();process.wait(timeout=5)

def captures(tmp_path):
    file=tmp_path/'captures.jsonl';return [json.loads(line) for line in file.read_text().splitlines()] if file.exists() else []

def prepare(tmp_path,settings,channels):
    (tmp_path/'clock.json').write_text(json.dumps({'now':NOW.isoformat()}))
    client=MongoClient(settings.mongo_url,tz_aware=True);db=client[settings.db_name]
    reference=str(uuid4());jobs={channel:new_job(channel,{'text':'Synthetic recovery'},reference,NOW) for channel in channels}
    db.enquiries.insert_one({'_id':reference,'idempotency_key':str(uuid4()),'jobs':jobs})
    return client,db,reference,jobs

def test_provider_outage_then_process_restart_preserves_retry_budget(settings,tmp_path,simulator):
    client,db,reference,jobs=prepare(tmp_path,settings,['ops_email','slack'])
    (tmp_path/'faults.json').write_text(json.dumps({'ops_email':{'status':500}}))
    process=spawn_worker(tmp_path,settings,simulator)
    try:
        wait_for(lambda:db.enquiries.find_one({'_id':reference})['jobs']['ops_email']['state']=='retry')
        wait_for(lambda:db.enquiries.find_one({'_id':reference})['jobs']['slack']['state']=='simulated')
        before=db.enquiries.find_one({'_id':reference})['jobs']['ops_email'];stop(process)
        (tmp_path/'faults.json').write_text('{}');(tmp_path/'clock.json').write_text(json.dumps({'now':(NOW+timedelta(seconds=31)).isoformat()}))
        process=spawn_worker(tmp_path,settings,simulator)
        wait_for(lambda:db.enquiries.find_one({'_id':reference})['jobs']['ops_email']['state']=='simulated')
        after=db.enquiries.find_one({'_id':reference})['jobs']['ops_email']
        assert after['attempts']==before['attempts']+1 and after['first_attempt_at']==before['first_attempt_at']
        assert after['job_id']==before['job_id'] and after['payload']==before['payload']
        assert len([c for c in captures(tmp_path) if c['channel']=='slack'])==1
    finally:stop(process);client.close()

@pytest.mark.parametrize('channel',['ops_email','slack'])
def test_crash_after_acceptance_before_result_persistence_recovers_same_identity(settings,tmp_path,simulator,channel):
    client,db,reference,jobs=prepare(tmp_path,settings,[channel]);process=spawn_worker(tmp_path,settings,simulator,crash=channel)
    try:
        wait_for(lambda:process.poll() is not None);assert process.returncode==77
        before=db.enquiries.find_one({'_id':reference})['jobs'][channel];assert before['state']=='sending'
        (tmp_path/'clock.json').write_text(json.dumps({'now':(NOW+timedelta(seconds=61)).isoformat()}))
        process=spawn_worker(tmp_path,settings,simulator)
        wait_for(lambda:db.enquiries.find_one({'_id':reference})['jobs'][channel]['state']=='simulated')
        after=db.enquiries.find_one({'_id':reference})['jobs'][channel]
        assert after['attempts']==2 and after['first_attempt_at']==before['first_attempt_at'] and after['job_id']==before['job_id']
        events=[c for c in captures(tmp_path) if c['job_id']==before['job_id']];assert len(events)==2
        assert events[0]['payload']==events[1]['payload']
        assert events[1]['deduplicated']==(channel=='ops_email')
    finally:stop(process);client.close()

def test_restart_after_23_hour_window_pauses_without_http_send(settings,tmp_path,simulator):
    client,db,reference,jobs=prepare(tmp_path,settings,['ops_email'])
    db.enquiries.update_one({'_id':reference},{'$set':{'jobs.ops_email.state':'sending','jobs.ops_email.attempts':1,'jobs.ops_email.first_attempt_at':NOW,'jobs.ops_email.lease_until':NOW+timedelta(seconds=60)}})
    (tmp_path/'clock.json').write_text(json.dumps({'now':(NOW+timedelta(hours=24)).isoformat()}));process=spawn_worker(tmp_path,settings,simulator)
    try:
        wait_for(lambda:db.enquiries.find_one({'_id':reference})['jobs']['ops_email']['state']=='unknown')
        assert db.enquiries.find_one({'_id':reference})['jobs']['ops_email']['automatic_paused']
        assert captures(tmp_path)==[]
    finally:stop(process);client.close()
