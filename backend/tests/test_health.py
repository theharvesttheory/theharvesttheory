from unittest.mock import AsyncMock
from pymongo.errors import ServerSelectionTimeoutError

def test_health_and_version_expose_only_safe_status(client):
    assert client.get('/api/health/live').json()=={'status':'ok'}
    assert client.get('/api/health/ready').status_code==200
    assert client.get('/api/version').json()=={'sha':'local'}

def test_database_unavailable_is_not_ready(client):
    client.app.state.repository.ping=AsyncMock(side_effect=ServerSelectionTimeoutError('SECRET CONNECTION STRING'))
    r=client.get('/api/health/ready')
    assert r.status_code==503
    assert 'SECRET' not in r.text
    assert client.get('/api/health/live').status_code==200

def test_missing_indexes_are_not_ready(client):
    client.app.state.repository.indexes_ready=False
    assert client.get('/api/health/ready').status_code==503

def test_template_and_public_data_routes_are_absent(client):
    for path in ('/api/status','/api/enquiries','/api/submissions','/api/newsletter/subscribers'):
        assert client.get(path).status_code in (404,405)
    assert client.post('/api/status',json={'client_name':'test'}).status_code==404

def test_production_has_no_documentation_routes():
    from fastapi.testclient import TestClient
    from config import Settings
    from server import create_app
    from test_config import production_env
    repo=AsyncMock()
    with TestClient(create_app(settings=Settings.from_env(production_env()),repository_factory=lambda s:repo)) as c:
        assert c.get('/docs').status_code==404
        assert c.get('/openapi.json').status_code==404
