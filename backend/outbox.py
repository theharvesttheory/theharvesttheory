"""Atomic job leases and ownership-fenced completion, including prior generations."""
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from pymongo import ReturnDocument
from repository import COLLECTIONS, JOB_SLOTS

ELIGIBLE=['pending','retry','unknown','sending']
EPOCH=datetime(1970,1,1,tzinfo=timezone.utc)

@dataclass(frozen=True)
class Claim:
    collection: str
    record_id: str
    slot: str
    job: dict
    owner: str
    history: bool = False

class Outbox:
    def __init__(self,repo,settings,clock):
        self.repo=repo;self.settings=settings;self.clock=clock

    async def claim(self,collection,slot,history=False):
        if collection not in COLLECTIONS or slot not in JOB_SLOTS:
            raise ValueError('Unknown job location')
        if history and (collection!='newsletter_subscribers' or slot=='confirmation_email'):
            raise ValueError('Invalid historical job channel')
        now=self.clock();owner=str(uuid4());until=now+timedelta(seconds=self.settings.lease_seconds)
        if history:
            match={'channel':slot,'state':{'$in':ELIGIBLE},'next_attempt_at':{'$lte':now},'automatic_paused':{'$ne':True},
                   '$or':[{'lease_until':None},{'lease_until':{'$lte':now}}]}
            eligible={'$and':[{'$eq':['$$job.channel',slot]},
                {'$in':['$$job.state',ELIGIBLE]}, {'$ne':[{'$ifNull':['$$job.automatic_paused',False]},True]}, {'$lte':['$$job.next_attempt_at',now]},
                {'$lte':[{'$ifNull':['$$job.lease_until',EPOCH]},now]}]}
            choose={'$arrayElemAt':[{'$filter':{'input':'$job_history','as':'job','cond':eligible}},0]}
            replacement={'$mergeObjects':['$$job',{'ambiguous':{'$or':[{'$eq':['$$job.ambiguous',True]},{'$in':['$$job.state',['sending','unknown']]}]},'state':'sending','lease_owner':owner,
                'lease_until':until,'attempts':{'$add':[{'$ifNull':['$$job.attempts',0]},1]},
                'first_attempt_at':{'$ifNull':['$$job.first_attempt_at',now]}}]}
            pipeline=[{'$set':{'_claim_job':choose}},
                      {'$set':{'job_history':{'$map':{'input':'$job_history','as':'job',
                       'in':{'$cond':[{'$eq':['$$job.job_id','$_claim_job.job_id']},replacement,'$$job']}}}}},
                      {'$unset':'_claim_job'}]
            record=await self.repo.db[collection].find_one_and_update(
                {'job_history':{'$elemMatch':match}},pipeline,
                sort=[('job_history.next_attempt_at',1)],return_document=ReturnDocument.AFTER)
            if not record:return None
            job=next(j for j in record['job_history'] if j.get('lease_owner')==owner)
        else:
            path=f'jobs.{slot}'
            query={f'{path}.automatic_paused':{'$ne':True},f'{path}.state':{'$in':ELIGIBLE},f'{path}.next_attempt_at':{'$lte':now},
                   '$or':[{f'{path}.lease_until':None},{f'{path}.lease_until':{'$lte':now}}]}
            if slot=='confirmation_email':
                query.update({'state':'pending','confirmation_expires_at':{'$gt':now},
                              '$expr':{'$eq':[f'${path}.generation','$generation']}})
            update={f'{path}.ambiguous':{'$or':[{'$eq':[f'${path}.ambiguous',True]},{'$in':[f'${path}.state',['sending','unknown']]}]},f'{path}.state':'sending',f'{path}.lease_owner':owner,f'{path}.lease_until':until,
                    f'{path}.attempts':{'$add':[{'$ifNull':[f'${path}.attempts',0]},1]},
                    f'{path}.first_attempt_at':{'$ifNull':[f'${path}.first_attempt_at',now]}}
            record=await self.repo.db[collection].find_one_and_update(query,[{'$set':update}],
                sort=[(f'{path}.next_attempt_at',1)],return_document=ReturnDocument.AFTER)
            if not record:return None
            job=record['jobs'][slot]
        return Claim(collection,record['_id'],slot,job,owner,history)

    async def finish(self,claim,updates):
        allowed={'state','next_attempt_at','accepted_at','provider_id','error_code','automatic_paused','ambiguous'}
        if set(updates)-allowed or updates.get('state') not in ('accepted','simulated','retry','unknown','dead','cancelled'):
            raise ValueError('Invalid delivery result')
        if not claim.history:
            success=await self._finish_at(claim,updates,False)
            if success:return True
            # Re-signup can move a still-leased ops job into history. Follow its identity,
            # never update a newer job which happens to reuse the same active slot.
            if claim.collection!='newsletter_subscribers' or claim.slot=='confirmation_email':
                return False
        return await self._finish_at(claim,updates,True)

    async def _finish_at(self,claim,updates,history):
        fence={'job_id':claim.job['job_id'],'generation':claim.job['generation'],
               'lease_owner':claim.owner,'state':'sending','lease_until':{'$gt':self.clock()}}
        if history:
            query={'_id':claim.record_id,'job_history':{'$elemMatch':fence}}
            prefix='job_history.$'
        else:
            prefix=f'jobs.{claim.slot}'
            query={'_id':claim.record_id,**{f'{prefix}.{key}':value for key,value in fence.items()}}
        result=await self.repo.db[claim.collection].update_one(query,
            {'$set':{f'{prefix}.{key}':value for key,value in updates.items()},
             '$unset':{f'{prefix}.lease_owner':'',f'{prefix}.lease_until':''}})
        return result.modified_count==1

    async def may_send(self,claim):
        from retry_policy import preflight
        decision=preflight(claim.job,self.clock(),self.settings.max_attempts)
        if decision:
            await self.finish(claim,decision)
            return False
        # A subscriber action may supersede the job between claim and HTTP dispatch.
        record=await self.repo.db[claim.collection].find_one({'_id':claim.record_id})
        if not record:return False
        jobs=list(record.get('jobs',{}).values())+record.get('job_history',[])
        current=next((j for j in jobs if j['job_id']==claim.job['job_id']),None)
        valid=current and current.get('state')=='sending' and current.get('lease_owner')==claim.owner and current.get('lease_until',EPOCH)>self.clock()
        if claim.slot=='confirmation_email':
            valid=valid and record.get('state')=='pending' and record.get('generation')==claim.job['generation'] and record.get('confirmation_expires_at',EPOCH)>self.clock()
        return bool(valid)

    async def record_outcome(self,claim,outcome,random=None):
        from retry_policy import transition
        kwargs={} if random is None else {'random':random}
        return await self.finish(claim,transition(claim.job,outcome,self.clock(),self.settings.max_attempts,**kwargs))
