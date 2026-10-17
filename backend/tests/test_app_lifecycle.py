import subprocess
import sys
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient
import pytest


def test_import_neither_reads_required_env_nor_connects():
    code = "import os; os.environ.pop('MONGO_URL',None); os.environ.pop('DB_NAME',None); from server import create_app; assert callable(create_app)"
    result = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


def test_clients_created_inside_lifespan_and_closed():
    from server import create_app
    from config import Settings
    events = []
    repository = AsyncMock()
    provider = AsyncMock()
    def repo_factory(settings):
        events.append('repository'); return repository
    def provider_factory(settings):
        events.append('provider'); return provider
    app = create_app(settings=Settings.from_env({}), repository_factory=repo_factory,
                     provider_factory=provider_factory)
    assert not events
    with TestClient(app):
        assert events == ['repository', 'provider']
        repository.start.assert_awaited_once()
    repository.close.assert_awaited_once()
    provider.aclose.assert_awaited_once()


def test_resource_cleanup_when_startup_fails():
    from server import create_app
    from config import Settings
    repository = AsyncMock()
    repository.start.side_effect = RuntimeError('injected startup failure')
    app = create_app(settings=Settings.from_env({}), repository_factory=lambda s: repository)
    with pytest.raises(RuntimeError):
        with TestClient(app):
            pass
    repository.close.assert_awaited_once()
