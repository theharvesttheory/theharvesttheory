"""Private operator CLI. Metadata only; no HTTP route exposes these functions."""
import argparse
import asyncio
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from uuid import uuid4
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from config import Settings
from repository import MongoRepository, COLLECTIONS
from retry_policy import WINDOW

FIELDS=('job_id','generation','channel','state','attempts','next_attempt_at','first_attempt_at',
        'lease_until','accepted_at','provider_id','error_code','automatic_paused','ambiguous')

async def inspect_jobs(repo,reference=None):
    projection={'_id':1,**{f'{prefix}.{key}':1 for prefix in ('jobs.ops_email','jobs.slack','jobs.confirmation_email','job_history') for key in FIELDS}}
    rows=[]
    for collection in COLLECTIONS:
        async for record in repo.db[collection].find({'_id':reference} if reference else {},projection):
            for history,jobs in ((False,list(record.get('jobs',{}).values())),(True,record.get('job_history',[]))):
                for job in jobs:
                    rows.append({'collection':collection,'reference':record['_id'],'history':history,**{k:job[k] for k in FIELDS if k in job}})
    return rows

async def summary(repo,now):
    rows=await inspect_jobs(repo)
    pending=[j for j in rows if j['state'] in ('pending','retry','sending','unknown') and not j.get('automatic_paused')]
    due=[j for j in pending if j.get('next_attempt_at') and j['next_attempt_at']<=now]
    oldest=max([max(0,(now-j['next_attempt_at']).total_seconds()) for j in due],default=0)
    dead=sum(j['state']=='dead' for j in rows);unknown=sum(j['state']=='unknown' for j in rows)
    heartbeat=await repo.db.service_heartbeats.find_one({},sort=[('updated_at',-1)])
    age=(now-heartbeat['updated_at']).total_seconds() if heartbeat else None
    return {'pending':len(pending),'oldest_due_seconds':oldest,'dead':dead,'unknown':unknown,
            'heartbeat_age_seconds':age,'degraded':oldest>300 or bool(dead or unknown)}

async def retry_job(repo,now,reference,channel,job_id,generation,apply=False,reconciliation='',allow_possible_duplicate=False):
    rows=await inspect_jobs(repo,reference)
    row=next((r for r in rows if r['channel']==channel and r['job_id']==job_id and r['generation']==generation),None)
    if not row:raise ValueError('No matching job identity and generation')
    if row['state'] not in ('dead','unknown','retry') or row.get('lease_until') and row['lease_until']>now:
        raise ValueError('Job is completed, cancelled, or actively leased')
    old=bool(row.get('first_attempt_at') and now-row['first_attempt_at']>=WINDOW)
    ambiguous=row.get('ambiguous') or row['state']=='unknown'
    guarded=old or ambiguous
    collection=repo.db[row['collection']]
    record=await collection.find_one({'_id':reference})
    if channel=='confirmation_email' and (record.get('state')!='pending' or record.get('generation')!=generation or record['confirmation_expires_at']<=now):
        raise ValueError('Confirmation generation is no longer current')
    result={'dry_run':not apply,'reference':reference,'job_id':job_id,'requires_reconciliation':bool(guarded),'new_identity':old}
    if not apply:return result
    if guarded and (not reconciliation.strip() or not allow_possible_duplicate):
        raise ValueError('Reconciliation and explicit possible-duplicate decision required')
    if len(reconciliation)>500:raise ValueError('Reconciliation note too long; use a non-sensitive evidence reference')
    updates={'state':'pending','next_attempt_at':now,'automatic_paused':False,'error_code':None,'attempts':0}
    if old:updates.update(job_id=str(uuid4()),first_attempt_at=None,ambiguous=False)
    fence={'job_id':job_id,'generation':generation,'state':row['state'],'attempts':row['attempts'],
           '$or':[{'lease_until':None},{'lease_until':{'$lte':now}}]}
    if row['history']:
        query={'_id':reference,'job_history':{'$elemMatch':fence}};prefix='job_history.$'
    else:
        prefix=f'jobs.{channel}'
        query={'_id':reference,**{f'{prefix}.{k}':v for k,v in fence.items() if k!='$or'},
               '$or':[{f'{prefix}.lease_until':None},{f'{prefix}.lease_until':{'$lte':now}}]}
    if channel=='confirmation_email':query.update(state='pending',generation=generation,confirmation_expires_at={'$gt':now})
    changed=await collection.update_one(query,{'$set':{f'{prefix}.{k}':v for k,v in updates.items()},
        '$unset':{f'{prefix}.lease_owner':'',f'{prefix}.lease_until':''},
        '$push':{'recovery_audit':{'at':now,'previous_job_id':job_id,'job_id':updates.get('job_id',job_id),
             'reason':reconciliation,'possible_duplicate':allow_possible_duplicate}}})
    if changed.modified_count!=1:raise ValueError('Job changed during review; inspect again')
    return result

async def run(args):
    repo=MongoRepository(Settings.from_env())
    try:
        await repo.start();now=datetime.now(timezone.utc)
        if args.command=='summary':result=await summary(repo,now)
        elif args.command=='inspect':result=await inspect_jobs(repo,args.id)
        else:result=await retry_job(repo,now,args.id,args.channel,args.job_id,args.generation,
                  args.apply,args.reconciliation,args.allow_possible_duplicate)
        print(json.dumps(result,default=str,indent=2))
    finally:await repo.close()

def main():
    parser=argparse.ArgumentParser(description=__doc__);commands=parser.add_subparsers(dest='command',required=True)
    commands.add_parser('summary')
    inspect=commands.add_parser('inspect');inspect.add_argument('--id',required=True)
    retry=commands.add_parser('retry')
    for name in ('id','channel','job-id','generation'):retry.add_argument('--'+name,required=True)
    group=retry.add_mutually_exclusive_group();group.add_argument('--dry-run',action='store_true');group.add_argument('--apply',action='store_true')
    retry.add_argument('--reconciliation',default='');retry.add_argument('--allow-possible-duplicate',action='store_true')
    try:asyncio.run(run(parser.parse_args()))
    except Exception as exc:
        print(f'Command failed ({type(exc).__name__}); check configuration and job eligibility.',file=sys.stderr);sys.exit(1)

if __name__=='__main__':main()
