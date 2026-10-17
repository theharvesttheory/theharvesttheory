"""Side-effect-free factory; application resources belong to lifespan."""
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import httpx
from fastapi import FastAPI
from repository import MongoRepository
from health import router as health_router
from config import Settings

def create_app(settings=None, repository_factory=None, provider_factory=None, clock=None):
    @asynccontextmanager
    async def lifespan(app):
        active = settings or Settings.from_env()
        active.validate()
        app.state.settings = active
        app.state.clock = clock or (lambda: datetime.now(timezone.utc))
        repo = (repository_factory or MongoRepository)(active)
        app.state.repository = repo
        providers = None
        try:
            await repo.start()
            providers = (provider_factory or (lambda s: httpx.AsyncClient(
                timeout=s.http_timeout_seconds, follow_redirects=False, trust_env=False)))(active)
            app.state.providers = providers
            yield
        finally:
            if providers is not None:
                await providers.aclose()
            await repo.close()
    local = settings is not None and settings.app_env in ('local','test')
    app = FastAPI(title='The Harvest Theory Intake', lifespan=lifespan,
                  docs_url='/docs' if local else None, redoc_url=None,
                  openapi_url='/openapi.json' if local else None)
    @app.get('/api/')
    async def identity():
        return {'service':'theharvesttheory'}
    app.include_router(health_router)
    return app

app = create_app()
