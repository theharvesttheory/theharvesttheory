#!/usr/bin/env python3
"""Restore synthetic BSON into a different database and compare records and indexes."""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from uuid import uuid4
from pymongo import MongoClient
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend'))
from delivery_models import new_job

def main():
    os.umask(0o077)
    for tool in ('mongodump','mongorestore'):
        if not shutil.which(tool):raise RuntimeError(f'{tool} is required for the local drill')
    nonce=uuid4().hex;source='tht_backupcheck_'+nonce;target='tht_restorecheck_'+nonce
    directory=ROOT/'.local/backup-drill'/nonce;directory.mkdir(parents=True,mode=0o700)
    archive=directory/'synthetic.archive.gz';client=MongoClient('mongodb://127.0.0.1:27017',tz_aware=True,serverSelectionTimeoutMS=2000)
    assert source not in client.list_database_names() and target not in client.list_database_names()
    try:
        now=datetime.now(timezone.utc);db=client[source]
        for state in ('pending','simulated'):
            reference=str(uuid4());job=new_job('ops_email',{'text':'Synthetic backup fixture'},reference,now);job['state']=state
            db.enquiries.insert_one({'_id':reference,'idempotency_key':str(uuid4()),'fields':{'email':'backup@example.test'},'received_at':now,'jobs':{'ops_email':job}})
        db.enquiries.create_index('idempotency_key',unique=True)
        db.newsletter_subscribers.insert_one({'_id':str(uuid4()),'email':'backup@example.test','state':'pending','consent_at':now})
        db.newsletter_subscribers.create_index('email',unique=True)
        subprocess.run(['mongodump','--uri','mongodb://127.0.0.1:27017','--db',source,'--archive='+str(archive),'--gzip'],check=True,capture_output=True)
        digest=hashlib.sha256(archive.read_bytes()).hexdigest()
        subprocess.run(['mongorestore','--uri','mongodb://127.0.0.1:27017','--archive='+str(archive),'--gzip','--nsFrom',source+'.*','--nsTo',target+'.*'],check=True,capture_output=True)
        counts={}
        for collection in ('enquiries','newsletter_subscribers'):
            original=list(client[source][collection].find({}).sort('_id',1));restored=list(client[target][collection].find({}).sort('_id',1))
            assert original==restored
            assert client[source][collection].index_information()==client[target][collection].index_information()
            counts[collection]=len(restored)
        assert client[target].enquiries.count_documents({'jobs.ops_email.state':'pending'})==1
        report={'verified_at':datetime.now(timezone.utc).isoformat(),'counts':counts,'records_equal':True,'indexes_equal':True,'pending_job_preserved':True,'archive_sha256':digest,'scope':'local synthetic BSON round trip; cloud backup encryption and scheduling deferred'}
        (directory/'evidence.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    finally:
        client.drop_database(source);client.drop_database(target);client.close();archive.unlink(missing_ok=True)

if __name__=='__main__':main()
