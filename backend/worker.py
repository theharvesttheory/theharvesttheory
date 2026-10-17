"""Lifespan-owned, bounded delivery poller; Mongo is the sole queue of record."""
import asyncio
from datetime import timedelta
import logging
from random import random
from uuid import uuid4
from pymongo.errors import PyMongoError
from outbox import Outbox
from notifications.common import Outcome
from notifications.local import LocalAdapter
from notifications.resend import ResendAdapter
from notifications.slack import SlackAdapter

logger=logging.getLogger(__name__)
LOCATIONS=[('enquiries','ops_email',False),('enquiries','slack',False),
    ('newsletter_subscribers','confirmation_email',False),('newsletter_subscribers','ops_email',False),
    ('newsletter_subscribers','slack',False),('newsletter_subscribers','ops_email',True),
    ('newsletter_subscribers','slack',True)]

class Worker:
    def __init__(self,repo,settings,client,clock,adapter_factory=None):
        self.repo=repo;self.settings=settings;self.client=client;self.clock=clock
        self.outbox=Outbox(repo,settings,clock);self.id=str(uuid4())
        self.stopping=asyncio.Event();self.task=None;self.last_heartbeat=None
        self.semaphore=asyncio.Semaphore(2)
        self.adapters={c:(adapter_factory(c) if adapter_factory else self.adapter(c)) for c in ('ops_email','confirmation_email','slack')}

    def adapter(self,channel):
        if self.settings.notification_mode=='fake':return LocalAdapter(self.client,self.settings,channel)
        if channel=='slack':return SlackAdapter(self.client,self.settings.slack_webhook_url)
        return ResendAdapter(self.client,self.settings.resend_api_key)

    async def heartbeat(self):
        now=self.clock()
        await self.repo.db.service_heartbeats.update_one({'_id':self.id},
            {'$set':{'updated_at':now,'expires_at':now+timedelta(seconds=90)}},upsert=True)
        self.last_heartbeat=now

    def healthy(self):
        return bool(self.task and not self.task.done() and self.last_heartbeat and
                    (self.clock()-self.last_heartbeat).total_seconds()<30)

    async def start(self):
        if self.task is not None:raise RuntimeError('Worker already started')
        await self.heartbeat()
        self.task=asyncio.create_task(self.run(),name='harvest-delivery-worker')
        self.task.add_done_callback(self.completed)

    def completed(self,task):
        if not task.cancelled() and task.exception() is not None:
            logger.error('delivery_worker_stopped error_class=%s',type(task.exception()).__name__)

    async def stop(self,timeout=12):
        self.stopping.set()
        if self.task is None:return
        try:
            await asyncio.wait_for(asyncio.shield(self.task),timeout)
        except asyncio.TimeoutError:
            self.task.cancel()
            await asyncio.gather(self.task,return_exceptions=True)
        except (asyncio.CancelledError,Exception):
            # Retrieve loop exceptions on shutdown; readiness already exposes failure.
            await asyncio.gather(self.task,return_exceptions=True)

    async def run(self):
        while not self.stopping.is_set():
            try:await asyncio.wait_for(self.stopping.wait(),self.settings.poll_seconds*(.9+.2*random()))
            except asyncio.TimeoutError:pass
            if self.stopping.is_set():break
            try:
                await self.tick()
                await self.heartbeat()
            except PyMongoError as exc:
                logger.warning('delivery_database_unavailable error_class=%s',type(exc).__name__)

    async def tick(self):
        now=self.clock()
        # Expired confirmation jobs must not stay pending forever or send obsolete links.
        await self.repo.db.newsletter_subscribers.update_many(
            {'confirmation_expires_at':{'$lte':now},'jobs.confirmation_email.state':{'$in':['pending','retry','unknown','sending']}},
            {'$set':{'jobs.confirmation_email.state':'cancelled','jobs.confirmation_email.error_code':'confirmation_expired'},
             '$unset':{'jobs.confirmation_email.lease_owner':'','jobs.confirmation_email.lease_until':''}})
        # Await every task even if one channel fails; no orphan work on lifespan shutdown.
        results=await asyncio.gather(*(self.deliver(*location) for location in LOCATIONS),return_exceptions=True)
        for result in results:
            if isinstance(result,BaseException):raise result

    async def deliver(self,collection,channel,history):
        async with self.semaphore:
            if self.stopping.is_set():return
            claim=await self.outbox.claim(collection,channel,history)
            if claim is None or not await self.outbox.may_send(claim):return
            try:
                outcome=await asyncio.wait_for(self.adapters[channel].send(claim.job),self.settings.http_timeout_seconds+1)
            except asyncio.TimeoutError:
                outcome=Outcome('unknown','send_timeout')
            await self.outbox.record_outcome(claim,outcome)
            logger.info('delivery_outcome channel=%s job_id=%s state=%s code=%s',channel,claim.job['job_id'],outcome.kind,outcome.code)
            await self.heartbeat()
