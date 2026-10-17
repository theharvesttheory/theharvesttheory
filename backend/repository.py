"""Mongo persistence, initialized inside the application's event loop."""
from pymongo import AsyncMongoClient
from pymongo.write_concern import WriteConcern

JOB_SLOTS=('ops_email','slack','confirmation_email')
COLLECTIONS=('enquiries','newsletter_subscribers')

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
