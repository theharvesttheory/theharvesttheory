import asyncio
from dataclasses import replace
from unittest.mock import AsyncMock
import httpx
import pytest
from pymongo.errors import AutoReconnect
from test_outbox_leases import prepare
from notifications.common import Outcome

@pytest.mark.asyncio
async def test_due_jobs_simulated_and_worker_shutdown(settings,clock):
    from worker import Worker
    repo,outbox,doc=await prepare(settings,clock)
    calls=[]
    def capture(request):
        calls.append(request)
        assert request.url.host=='127.0.0.1'
        return httpx.Response(200,json={'id':'fake-1'})
    async with httpx.AsyncClient(transport=httpx.MockTransport(capture)) as client:
        worker=Worker(repo,settings,client,clock)
        try:
            await worker.start();assert worker.task and worker.healthy()
            await worker.tick()
            record=await repo.db.enquiries.find_one({'_id':doc['_id']})
            assert record['jobs']['ops_email']['state']=='simulated' and len(calls)==1
            await worker.stop();assert worker.task.done()
        finally:await worker.stop();await repo.close()

@pytest.mark.asyncio
async def test_overlapping_workers_one_send_and_failure_isolation(settings,clock):
    from worker import Worker
    from delivery_models import new_job
    repo,outbox,doc=await prepare(settings,clock)
    await repo.db.enquiries.update_one({'_id':doc['_id']},{'$set':{'jobs.slack':new_job('slack',{},'1',clock())}})
    counts={'ops_email':0,'slack':0}
    class Adapter:
        async def send(self,job):
            counts[job['channel']]+=1
            return Outcome('retryable','busy') if job['channel']=='ops_email' else Outcome('simulated','local')
    workers=[Worker(repo,settings,None,clock,adapter_factory=lambda channel:Adapter()) for _ in range(2)]
    try:
        await asyncio.gather(*(w.tick() for w in workers))
        assert counts=={'ops_email':1,'slack':1}
        record=await repo.db.enquiries.find_one({'_id':doc['_id']})
        assert record['jobs']['ops_email']['state']=='retry' and record['jobs']['slack']['state']=='simulated'
    finally:await repo.close()

@pytest.mark.asyncio
async def test_transient_database_failure_loop_recovers_and_dead_loop_unhealthy(settings,clock,monkeypatch):
    from worker import Worker
    repo,outbox,doc=await prepare(settings,clock)
    worker=Worker(repo,replace(settings,poll_seconds=.01),None,clock,adapter_factory=lambda c:AsyncMock())
    event=asyncio.Event();count=0
    async def tick():
        nonlocal count
        count+=1
        if count==1:raise AutoReconnect('SECRET')
        event.set()
    monkeypatch.setattr(worker,'tick',tick)
    try:
        await worker.start()
        await asyncio.wait_for(event.wait(),1)
        assert not worker.task.done()
        worker.task.cancel();await asyncio.gather(worker.task,return_exceptions=True)
        assert not worker.healthy()
    finally:await worker.stop();await repo.close()

@pytest.mark.asyncio
async def test_shutdown_bounds_stalled_send_and_leaves_recoverable_lease(settings,clock):
    from worker import Worker
    repo,outbox,doc=await prepare(settings,clock)
    entered=asyncio.Event()
    class Adapter:
        async def send(self,job):
            entered.set();await asyncio.Event().wait()
    worker=Worker(repo,replace(settings,poll_seconds=.01),None,clock,adapter_factory=lambda c:Adapter())
    try:
        await worker.start();await asyncio.wait_for(entered.wait(),1)
        await worker.stop(timeout=.02)
        assert worker.task.done()
        record=await repo.db.enquiries.find_one({'_id':doc['_id']})
        assert record['jobs']['ops_email']['state']=='sending'
        clock.advance(61)
        assert await outbox.claim('enquiries','ops_email')
    finally:await worker.stop();await repo.close()

def test_lifespan_worker_failure_changes_readiness(settings,clock,provider_factory):
    from fastapi.testclient import TestClient
    from server import create_app
    with TestClient(create_app(settings=replace(settings,worker_enabled=True),clock=clock,provider_factory=provider_factory)) as client:
        assert client.get('/api/health/ready').status_code==200
        client.portal.call(client.app.state.worker.stop)
        assert client.get('/api/health/ready').status_code==503
