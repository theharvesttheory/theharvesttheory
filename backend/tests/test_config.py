import pytest


def production_env():
    return {
        'APP_ENV': 'production', 'APP_GIT_SHA': 'a' * 40,
        'MONGO_URL': 'mongodb+srv://test:secret@cluster.example.test/',
        'DB_NAME': 'harvest', 'CORS_ORIGINS': 'https://harvest.example.test',
        'PUBLIC_FRONTEND_URL': 'https://harvest.example.test',
        'NOTIFICATION_MODE': 'live', 'BOT_MODE': 'turnstile',
        'RESEND_API_KEY': 're_test_configuration_only',
        'SENDER_EMAIL': 'hello@harvest.example.test',
        'NOTIFY_EMAILS': 'owner@example.test', 'SUPPORT_EMAIL': 'help@example.test',
        'SLACK_WEBHOOK_URL': 'https://hooks.slack.com/services/test/config/only',
        'NEWSLETTER_SIGNING_KEY': 'n' * 48, 'RATE_LIMIT_HMAC_KEY': 'r' * 48,
        'TURNSTILE_SECRET_KEY': 'test-configuration-only',
        'TURNSTILE_HOSTNAMES': 'harvest.example.test', 'WORKER_ENABLED': 'true',
    }


def test_explicit_local_settings():
    from config import Settings
    settings = Settings.from_env({})
    assert settings.app_env == 'local'
    assert settings.notification_mode == 'fake'
    assert settings.mongo_url.startswith('mongodb://127.0.0.1')


def test_complete_production_configuration():
    from config import Settings
    settings = Settings.from_env(production_env())
    assert settings.app_env == 'production'
    assert settings.notification_mode == 'live'
    assert 're_test_configuration_only' not in repr(settings)


@pytest.mark.parametrize('key,value', [
    ('NOTIFICATION_MODE','fake'), ('BOT_MODE','fake'), ('RESEND_API_KEY',''),
    ('CORS_ORIGINS','*'), ('PUBLIC_FRONTEND_URL','http://harvest.example.test'),
    ('NEWSLETTER_SIGNING_KEY','short'), ('RATE_LIMIT_HMAC_KEY','local-only-key'),
    ('SLACK_WEBHOOK_URL','https://attacker.example.test'), ('WORKER_ENABLED','false'),
    ('LOCAL_PROVIDER_BASE_URL','http://127.0.0.1:8301'),
    ('TURNSTILE_HOSTNAMES',''), ('SENDER_EMAIL','owner@gmail.com'),
    ('MONGO_URL','mongodb://127.0.0.1:27017'), ('APP_GIT_SHA','local'),
])
def test_production_fails_closed(key, value):
    from config import Settings, ConfigurationError
    env = production_env(); env[key] = value
    with pytest.raises(ConfigurationError):
        Settings.from_env(env)


def test_render_cannot_implicitly_start_local_mode():
    from config import Settings, ConfigurationError
    with pytest.raises(ConfigurationError):
        Settings.from_env({'RENDER':'true'})


@pytest.mark.parametrize('key,value', [('APP_ENV','prodution'), ('WORKER_ENABLED','perhaps'),
                                     ('IP_RATE_LIMIT','0'), ('GLOBAL_RATE_LIMIT','-1')])
def test_invalid_configuration_is_rejected(key, value):
    from config import Settings, ConfigurationError
    with pytest.raises(ConfigurationError):
        Settings.from_env({key:value})
