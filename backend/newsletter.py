"""Consent lifecycle; every state change and its jobs share one Mongo write."""
from datetime import timedelta
from uuid import uuid4
from pymongo.errors import DuplicateKeyError
from models import normalize_newsletter
from notifications.rendering import build_confirmation_job, build_newsletter_ops_jobs
from errors import APIError
from newsletter_tokens import verify_action_token, invalid_link

RECEIPT={'status':'requested'}
UNRESOLVED=['pending','sending','retry','unknown','dead']


def cancel_unfinished_confirmation():
    return {'$cond':[{'$in':['$jobs.confirmation_email.state',UNRESOLVED]},
                     'cancelled','$jobs.confirmation_email.state']}

class NewsletterService:
    def __init__(self,repository,settings,clock,confirmation_factory=None,ops_factory=None):
        self.repo=repository;self.settings=settings;self.clock=clock
        self.confirmation_factory=confirmation_factory or build_confirmation_job
        self.ops_factory=ops_factory

    async def request_signup(self,payload):
        value=normalize_newsletter(payload,allow_test_domains=self.settings.app_env!='production')
        now=self.clock();collection=self.repo.db.newsletter_subscribers
        existing=await collection.find_one({'email':value['email']})
        if existing:
            if existing['state']=='subscribed': return dict(RECEIPT)
            if existing['state']=='pending' and now-existing['last_confirmation_enqueued_at']<timedelta(minutes=10):
                return dict(RECEIPT)
            if len(existing.get('job_history',[]))>=98:
                raise APIError(503,'temporarily_unavailable','Please try again later.',retry_after=600)
        record={'_id':existing['_id'] if existing else str(uuid4()),'schema_version':1,
            'email':value['email'],'state':'pending','created_at':existing['created_at'] if existing else now,
            'consent_at':now,'privacy_notice_version':value['privacy_notice_version'],
            'source_path':value['source_path'],'generation':str(uuid4()),
            'generation_created_at':now,'confirmation_expires_at':now+timedelta(hours=24),
            'last_confirmation_enqueued_at':now,'confirmed_at':None,'unsubscribed_at':None}
        record['jobs']={'confirmation_email':self.confirmation_factory(record,self.settings,now)}
        if not existing:
            record['job_history']=[]
            try: await collection.insert_one(record)
            except DuplicateKeyError as exc:
                # The unique canonical-email index arbitrates concurrent requests.
                if (exc.details or {}).get('keyPattern')!={'email':1}: raise
        else:
            # The pipeline snapshots current job states atomically, not a stale pre-read.
            # An already sent job must not be resurrected when a generation changes.
            active={'$map':{'input':{'$filter':{'input':{'$objectToArray':'$jobs'},'as':'pair',
                'cond':{'$and':[{'$ne':['$$pair.k','confirmation_email']},
                               {'$in':['$$pair.v.state',UNRESOLVED]}]}}},'as':'pair','in':'$$pair.v'}}
            update={k:{'$literal':v} for k,v in record.items() if k!='_id'}
            update['job_history']={'$concatArrays':[{'$ifNull':['$job_history',[]]},active]}
            await collection.update_one({'_id':existing['_id'],'generation':existing['generation'],
                'state':existing['state']},[{'$set':update}])
            # A losing compare-and-set means another signup or consent action won.
            # Never overwrite that newer choice; the public receipt is deliberately generic.
        return dict(RECEIPT)

    async def confirm(self,token):
        now=self.clock()
        claims=verify_action_token(token,'confirm',self.settings,now)
        collection=self.repo.db.newsletter_subscribers
        identity={'_id':claims['sub'],'generation':claims['generation']}
        record=await collection.find_one(identity)
        if not record or record['state']=='unsubscribed': raise invalid_link()
        if record['state']=='subscribed': return {'status':'subscribed'}
        if record['confirmation_expires_at']<=now: raise invalid_link()
        jobs=(self.ops_factory or build_newsletter_ops_jobs)({**record,'state':'subscribed','confirmed_at':now},self.settings,now)
        changes={'state':'subscribed','confirmed_at':now,
                 'jobs.confirmation_email.state':cancel_unfinished_confirmation(),
                 'jobs.confirmation_email.lease_owner':None,'jobs.confirmation_email.lease_until':None}
        changes.update({f'jobs.{slot}':{'$literal':job} for slot,job in jobs.items()})
        result=await collection.update_one({**identity,'state':'pending',
            'confirmation_expires_at':{'$gt':now}},[{'$set':changes}])
        if not result.modified_count:
            current=await collection.find_one(identity)
            if not current or current['state']!='subscribed': raise invalid_link()
        return {'status':'subscribed'}

    async def unsubscribe(self,token):
        now=self.clock()
        claims=verify_action_token(token,'unsubscribe',self.settings,now)
        collection=self.repo.db.newsletter_subscribers
        identity={'_id':claims['sub'],'generation':claims['generation']}
        result=await collection.update_one({**identity,'state':{'$in':['pending','subscribed']}},
            [{'$set':{'state':'unsubscribed','unsubscribed_at':now,
                'jobs.confirmation_email.state':cancel_unfinished_confirmation(),
                'jobs.confirmation_email.lease_owner':None,'jobs.confirmation_email.lease_until':None}}])
        if not result.modified_count:
            current=await collection.find_one(identity)
            if not current or current['state']!='unsubscribed': raise invalid_link()
        return {'status':'unsubscribed'}
