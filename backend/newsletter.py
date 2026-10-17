"""Consent lifecycle; every state change and its jobs share one Mongo write."""
from datetime import timedelta
from uuid import uuid4
from pymongo.errors import DuplicateKeyError
from models import normalize_newsletter
from delivery_models import new_job
from errors import APIError

RECEIPT={'status':'requested'}
UNRESOLVED=['pending','sending','retry','unknown','dead']


def initial_confirmation_job(record,settings,now):
    return new_job('confirmation_email',{'reference':record['_id'],'rendering_pending':True},
                   record['generation'],now)

class NewsletterService:
    def __init__(self,repository,settings,clock,confirmation_factory=None,ops_factory=None):
        self.repo=repository;self.settings=settings;self.clock=clock
        self.confirmation_factory=confirmation_factory or initial_confirmation_job
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
