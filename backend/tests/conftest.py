"""Real Mongo fixtures: isolated namespace per test, with guarded teardown."""
import os
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from urllib.parse import urlsplit
from uuid import uuid4
import httpx
import pytest
import pytest_asyncio
from pymongo import AsyncMongoClient, MongoClient


def validate_test_mongo_url(url):
    p = urlsplit(url)
    hosts = {'127.0.0.1','localhost','::1'}
    # CI may name its dedicated service explicitly; never inherit application MONGO_URL.
    if os.environ.get('CI') == 'true':
        hosts.update(x for x in os.environ.get('TEST_MONGO_HOST_ALLOWLIST','').split(',') if x)
    if p.scheme != 'mongodb' or p.hostname not in hosts or p.username or p.password or ',' in p.netloc:
        raise ValueError('Tests require an isolated, unauthenticated local/CI Mongo server')
    return url

@pytest.fixture
def mongo_url():
    return validate_test_mongo_url(os.environ.get('TEST_MONGO_URL','mongodb://127.0.0.1:27017'))

@pytest.fixture
def database_name(worker_id, mongo_url):
    name = f'tht_test_{worker_id}_{uuid4().hex}'
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
    client.admin.command('ping')  # unavailable DB is a hard failure, never a skip
    try:
        yield name
    finally:
        assert name.startswith(f'tht_test_{worker_id}_') and len(name.split('_')[-1]) == 32
        client.drop_database(name)
        client.close()

@pytest_asyncio.fixture
async def mongo_db(mongo_url, database_name):
    client = AsyncMongoClient(mongo_url, tz_aware=True, serverSelectionTimeoutMS=3000)
    try:
        yield client[database_name]
    finally:
        await client.close()

@dataclass
class Clock:
    value: datetime = datetime(2026,10,17,12,tzinfo=timezone.utc)
    def __call__(self):
        return self.value
    def advance(self, seconds):
        self.value += timedelta(seconds=seconds)

@pytest.fixture
def clock():
    return Clock()

@pytest.fixture
def settings(mongo_url, database_name):
    from config import Settings
    return Settings.from_env({'APP_ENV':'test','MONGO_URL':mongo_url,'DB_NAME':database_name,'WORKER_ENABLED':'false'})

@pytest.fixture
def captured_requests():
    return []

@pytest.fixture
def provider_factory(captured_requests):
    def capture(request):
        captured_requests.append(request)
        raise AssertionError('Unexpected provider call: configure an explicit test response')
    return lambda settings: httpx.AsyncClient(transport=httpx.MockTransport(capture))

@pytest.fixture
def client(settings, clock, provider_factory):
    from fastapi.testclient import TestClient
    from server import create_app
    with TestClient(create_app(settings=settings, clock=clock, provider_factory=provider_factory)) as value:
        yield value

@pytest.fixture
def anyio_backend():
    return 'asyncio'
