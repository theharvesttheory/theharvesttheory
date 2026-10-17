"""Private data lifecycle commands. Review is the default; mutations require exact scope."""
import argparse
import asyncio
from copy import deepcopy
from datetime import datetime, timezone, timedelta
import json
import os
from pathlib import Path
import sys
from uuid import UUID
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from config import Settings
from repository import MongoRepository, COLLECTIONS, JOB_SLOTS

UNRESOLVED={'pending','sending','retry','unknown','dead'}
TERMINAL={'accepted','simulated','cancelled'}

def jobs(record):return list(record.get('jobs',{}).values())+record.get('job_history',[])
def unresolved(record):return any(job.get('state') not in TERMINAL for job in jobs(record))
def fence(record):
    # Recheck the full delivery snapshot atomically; concurrent work or consent wins.
    query={'_id':record['_id']}
    for name in ('jobs','job_history','state','generation','consent_at'):
        query[name]=record[name] if name in record else {'$exists':False}
    return query

def mutation_guard(repo,apply,database):
    if apply and database!=repo.db.name:raise ValueError('Mutation requires the exact configured database name')

def check_identity(collection,reference):
    if collection not in COLLECTIONS or str(UUID(reference))!=reference:raise ValueError('Choose an exact collection and UUID reference')

async def retain(repo,now,scope='all',apply=False,database=None,policy_approved=False,enquiry_days=180,pending_days=7,payload_days=7,outcome_days=30):
    mutation_guard(repo,apply,database)
    if apply and not policy_approved:raise ValueError('Owner-approved retention policy required')
    if scope not in ('all','enquiries','newsletter'):raise ValueError('Invalid retention scope')
    if not all(type(days) is int and days>0 for days in (enquiry_days,pending_days,payload_days,outcome_days)) or outcome_days<payload_days:raise ValueError('Invalid retention periods')
    report={'dry_run':not apply,'eligible_deletions':0,'redacted_payloads':0,'pruned_outcomes':0,'review_required':0,'applied_records':0,'concurrent_skips':0}
    collections=COLLECTIONS if scope=='all' else ('enquiries',) if scope=='enquiries' else ('newsletter_subscribers',)
    for name in collections:
        async for record in repo.db[name].find({}):
            blocked=unresolved(record)
            born=record.get('received_at') if name=='enquiries' else record.get('generation_created_at',record.get('created_at'))
            expired=bool(born and now-born>=timedelta(days=enquiry_days if name=='enquiries' else pending_days))
            eligible=expired and (name=='enquiries' or record.get('state')=='pending')
            if blocked:report['review_required']+=1
            if eligible and not blocked:
                report['eligible_deletions']+=1
                if apply:
                    changed=await repo.db[name].delete_one(fence(record));report['applied_records']+=changed.deleted_count;report['concurrent_skips']+=int(changed.deleted_count==0)
                continue
            updated=deepcopy(record)
            def clean(job,history=False):
                if job.get('state') not in TERMINAL:return job
                finished=job.get('accepted_at') or job.get('first_attempt_at') or born
                if not finished:return job
                if now-finished>=timedelta(days=outcome_days):
                    minimal={k:job[k] for k in ('job_id','generation','channel','state') if k in job}
                    if history or minimal!=job:report['pruned_outcomes']+=1
                    if 'payload' in job:report['redacted_payloads']+=1
                    return None if history else minimal
                if now-finished>=timedelta(days=payload_days) and 'payload' in job:
                    report['redacted_payloads']+=1;job.pop('payload')
                return job
            updated['jobs']={slot:clean(job) for slot,job in updated.get('jobs',{}).items()}
            updated['job_history']=[cleaned for job in updated.get('job_history',[]) if (cleaned:=clean(job,True)) is not None]
            changed=updated.get('jobs')!=record.get('jobs',{}) or updated['job_history']!=record.get('job_history',[])
            if changed and apply:
                result=await repo.db[name].update_one(fence(record),{'$set':{'jobs':updated['jobs'],'job_history':updated['job_history']}})
                report['applied_records']+=result.modified_count;report['concurrent_skips']+=int(result.modified_count==0)
    return report

async def export_record(repo,collection,reference):
    check_identity(collection,reference)
    # Explicit export can contain personal fields, but never queued bearer links/payloads.
    return await repo.db[collection].find_one({'_id':reference},{**{f'jobs.{slot}.payload':0 for slot in JOB_SLOTS},'job_history.payload':0})

async def delete_record(repo,collection,reference,apply=False,database=None):
    check_identity(collection,reference);mutation_guard(repo,apply,database)
    record=await repo.db[collection].find_one({'_id':reference})
    if not record:return {'dry_run':not apply,'found':False,'deleted':False}
    if unresolved(record):raise ValueError('Unresolved delivery requires reconciliation before deletion')
    result={'dry_run':not apply,'found':True,'deleted':False}
    if apply:
        deleted=await repo.db[collection].delete_one(fence(record))
        if deleted.deleted_count!=1:raise ValueError('Record changed during review; inspect again')
        result['deleted']=True
    return result

async def run(args):
    repo=MongoRepository(Settings.from_env())
    try:
        await repo.start()
        if args.command=='retention':
            result=await retain(repo,datetime.now(timezone.utc),scope=args.scope,apply=args.apply,database=args.database,
                policy_approved=args.policy_approved,enquiry_days=args.enquiry_days,pending_days=args.pending_days,
                payload_days=args.payload_days,outcome_days=args.outcome_days)
        elif args.command=='delete':result=await delete_record(repo,args.collection,args.id,args.apply,args.database)
        else:
            record=await export_record(repo,args.collection,args.id)
            if record is None:result={'found':False}
            else:
                fd=os.open(args.output,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
                with os.fdopen(fd,'w') as output:json.dump(record,output,default=str,indent=2)
                result={'found':True,'written':True} # Do not echo personal data or path.
        print(json.dumps(result))
    finally:await repo.close()

def main():
    parser=argparse.ArgumentParser(description=__doc__);commands=parser.add_subparsers(dest='command',required=True)
    retention=commands.add_parser('retention');retention.add_argument('--scope',choices=['all','enquiries','newsletter'],required=True)
    retention.add_argument('--policy-approved',action='store_true')
    for name,default in [('enquiry-days',180),('pending-days',7),('payload-days',7),('outcome-days',30)]:retention.add_argument('--'+name,type=int,default=default)
    delete=commands.add_parser('delete');export=commands.add_parser('export')
    for command in (delete,export):
        command.add_argument('--collection',choices=COLLECTIONS,required=True);command.add_argument('--id',required=True)
    for command in (retention,delete):
        command.add_argument('--database');group=command.add_mutually_exclusive_group();group.add_argument('--apply',action='store_true');group.add_argument('--dry-run',action='store_true')
    export.add_argument('--output',required=True)
    try:asyncio.run(run(parser.parse_args()))
    except Exception as exc:print(f'Data command failed ({type(exc).__name__}); inspect scope, policy and configuration.',file=sys.stderr);sys.exit(1)
if __name__=='__main__':main()
