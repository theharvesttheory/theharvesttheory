"""Subprocess fault fixture; explicit isolated database and fake provider only."""
import asyncio
from datetime import datetime
import json
import os
from pathlib import Path
import signal
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from urllib.parse import urlsplit
import httpx
from config import Settings
from repository import MongoRepository
from worker import Worker

async def main():
    config=json.loads(Path(sys.argv[1]).read_text());url=urlsplit(config['mongo_url'])
    if url.scheme!='mongodb' or url.hostname not in ('127.0.0.1','localhost','mongo') or url.username or url.password or not config['database'].startswith('tht_test_'):
        raise ValueError('Recovery tests require isolated local/CI data')
    if url.hostname=='mongo' and os.environ.get('CI')!='true':raise ValueError('CI Mongo host not approved')
    settings=Settings.from_env({'APP_ENV':'test','MONGO_URL':config['mongo_url'],'DB_NAME':config['database'],
        'LOCAL_PROVIDER_BASE_URL':config['provider'],'POLL_SECONDS':'0.05'})
    clock=lambda:datetime.fromisoformat(json.loads(Path(config['clock']).read_text())['now'])
    repo=MongoRepository(settings);await repo.start()
    stopped=asyncio.Event();loop=asyncio.get_running_loop()
    for sig in (signal.SIGTERM,signal.SIGINT):loop.add_signal_handler(sig,stopped.set)
    async with httpx.AsyncClient(trust_env=False) as client:
        worker=Worker(repo,settings,client,clock)
        original=worker.outbox.record_outcome
        async def record(claim,outcome,**kwargs):
            if claim.slot==config.get('crash') and outcome.kind=='simulated':os._exit(77)
            return await original(claim,outcome,**kwargs)
        worker.outbox.record_outcome=record
        try:await worker.start();await stopped.wait()
        finally:await worker.stop();await repo.close()

if __name__=='__main__':asyncio.run(main())
