"""Mongo persistence, initialized inside the application's event loop."""
from copy import deepcopy
from dataclasses import dataclass
from uuid import uuid4
from pymongo.errors import DuplicateKeyError
from pymongo import AsyncMongoClient
from pymongo.write_concern import WriteConcern

JOB_SLOTS=('ops_email','slack','confirmation_email')
COLLECTIONS=('enquiries','newsletter_subscribers')

class IdempotencyConflict(ValueError):
    pass

@dataclass(frozen=True)
class SavedEnquiry:
    record: dict
    created: bool

    @property
    def receipt(self):
        return {'id':self.record['_id'],'status':'received'}

class MongoRepository:
    def __init__(self, settings):
        self.client=AsyncMongoClient(settings.mongo_url,tz_aware=True,
                                    serverSelectionTimeoutMS=3000,timeoutMS=5000)
        self.db=self.client.get_database(settings.db_name,write_concern=WriteConcern(w='majority',wtimeout=3000))
        self.indexes_ready=False

    async def start(self):
        self.indexes_ready=False
        await self.ping()
        await self.ensure_indexes()
        self.indexes_ready=True

    async def ping(self):
        await self.db.command('ping')

    async def ensure_indexes(self):
        await self.db.enquiries.create_index('idempotency_key',unique=True)
        await self.db.enquiries.create_index('received_at')
        await self.db.newsletter_subscribers.create_index('email',unique=True)
        await self.db.newsletter_subscribers.create_index('state')
        await self.db.rate_limits.create_index('expires_at',expireAfterSeconds=0)
        await self.db.service_heartbeats.create_index('expires_at',expireAfterSeconds=0)
        for name in COLLECTIONS:
            for slot in JOB_SLOTS:
                await self.db[name].create_index([(f'jobs.{slot}.state',1),
                    (f'jobs.{slot}.next_attempt_at',1),(f'jobs.{slot}.lease_until',1)])

    async def close(self):
        await self.client.close()

    async def lookup_enquiry(self, key, payload_hash):
        record=await self.db.enquiries.find_one({'idempotency_key':key})
        if record is None:
            return None
        if record['payload_hash'] != payload_hash:
            raise IdempotencyConflict()
        return SavedEnquiry(record,False)

    async def insert_enquiry(self, document):
        await self.db.enquiries.insert_one(document)

    async def save_enquiry(self, normalized, key, payload_hash, jobs, now, record_id=None):
        existing=await self.lookup_enquiry(key,payload_hash)
        if existing:
            return existing
        record={'_id':record_id or str(uuid4()), 'schema_version':1,
                'type':normalized['type'], 'fields':deepcopy(normalized['fields']),
                'privacy_notice_version':normalized['privacy_notice_version'],
                'source_path':normalized['source_path'], 'received_at':now,
                'idempotency_key':key, 'payload_hash':payload_hash, 'jobs':deepcopy(jobs)}
        try:
            await self.insert_enquiry(record)
            return SavedEnquiry(record,True)
        except DuplicateKeyError:
            # Concurrent insertion is resolved by the unique key, never a second record.
            existing=await self.lookup_enquiry(key,payload_hash)
            if existing is None:
                raise
            return existing
