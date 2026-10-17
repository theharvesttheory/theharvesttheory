"""Validated runtime settings. Secret fields never participate in repr."""
from dataclasses import dataclass, field, fields
from pathlib import Path
from urllib.parse import urlsplit
import os
import re
from dotenv import dotenv_values

class ConfigurationError(ValueError):
    pass

def origin(value, https=False):
    p = urlsplit(value)
    return (p.scheme in ({'https'} if https else {'http','https'}) and bool(p.hostname)
            and not p.username and not p.password and not p.query and not p.fragment
            and p.path in ('','/'))

def split(value):
    return tuple(x.strip() for x in value.split(',') if x.strip())

@dataclass(frozen=True)
class Settings:
    app_env: str = 'local'
    app_git_sha: str = 'local'
    mongo_url: str = field(default='mongodb://127.0.0.1:27017', repr=False)
    db_name: str = 'theharvesttheory_local'
    cors_origins: tuple[str,...] = ('http://localhost:3000','http://127.0.0.1:3000')
    public_frontend_url: str = 'http://localhost:3000'
    notification_mode: str = 'fake'
    bot_mode: str = 'fake'
    local_provider_base_url: str = 'http://127.0.0.1:8301'
    resend_api_key: str = field(default='', repr=False)
    email_from_name: str = 'The Harvest Theory'
    sender_email: str = 'harvest@example.test'
    notify_emails: tuple[str,...] = ('team@example.test',)
    support_email: str = 'team@example.test'
    slack_webhook_url: str = field(default='', repr=False)
    newsletter_signing_key: str = field(default='local-only-newsletter-key-do-not-use-in-production', repr=False)
    rate_limit_hmac_key: str = field(default='local-only-rate-key-do-not-use-in-production', repr=False)
    turnstile_secret_key: str = field(default='', repr=False)
    turnstile_hostnames: tuple[str,...] = ('localhost','127.0.0.1')
    trusted_proxy_cidrs: tuple[str,...] = ()
    worker_enabled: bool = True
    ip_rate_limit: int = 10
    global_rate_limit: int = 300
    poll_seconds: float = 2.0
    lease_seconds: int = 60
    http_timeout_seconds: float = 10.0
    max_attempts: int = 8
    notice_version: str = '2026-10-17'

    @classmethod
    def from_env(cls, env=None):
        if env is None:
            env = {**dotenv_values(Path(__file__).with_name('.env')), **os.environ}
        env = {k:v for k,v in env.items() if v is not None}
        base = cls(); values = {}
        for f in fields(cls):
            default = getattr(base, f.name)
            raw = env.get(f.name.upper(), default)
            if isinstance(default, tuple):
                raw = split(raw) if isinstance(raw, str) else raw
            elif isinstance(default, bool):
                if str(raw).lower() not in ('true','false'):
                    raise ConfigurationError(f'{f.name.upper()} must be true or false')
                raw = str(raw).lower() == 'true'
            elif isinstance(default, (int,float)):
                try:
                    raw = type(default)(raw)
                    if raw <= 0: raise ValueError()
                except (TypeError, ValueError):
                    raise ConfigurationError(f'{f.name.upper()} must be positive') from None
            values[f.name] = raw
        if values['app_env'] == 'production' and 'LOCAL_PROVIDER_BASE_URL' not in env:
            values['local_provider_base_url'] = ''
        if env.get('RENDER') == 'true' and values['app_env'] != 'production':
            raise ConfigurationError('Render requires explicit production mode')
        settings = cls(**values); settings.validate(); return settings

    def validate(self):
        def require(condition, message):
            if not condition: raise ConfigurationError(message)
        require(self.app_env in ('local','test','production'), 'Invalid APP_ENV')
        prod = self.app_env == 'production'
        require(re.fullmatch(r'[A-Za-z0-9_-]{1,64}',self.db_name), 'Invalid DB_NAME')
        require(self.notification_mode in ('fake','live') and self.bot_mode in ('fake','turnstile'), 'Invalid delivery/bot mode')
        require(self.cors_origins and all(origin(x,prod) and not x.endswith('/') for x in self.cors_origins), 'CORS_ORIGINS must be exact origins')
        require(origin(self.public_frontend_url,prod), 'Invalid PUBLIC_FRONTEND_URL')
        if self.local_provider_base_url:
            require(origin(self.local_provider_base_url) and urlsplit(self.local_provider_base_url).hostname in ('localhost','127.0.0.1','::1'), 'Local provider must be loopback')
        require(1 <= self.max_attempts <= 8 and self.lease_seconds > self.http_timeout_seconds * 2 and self.poll_seconds <= 10, 'Invalid worker bounds')
        if self.notification_mode == 'live':
            require(self.resend_api_key and self.slack_webhook_url, 'Live credentials are required')
            p=urlsplit(self.slack_webhook_url)
            require(p.scheme=='https' and p.hostname in ('hooks.slack.com','hooks.slack-gov.com') and p.path.startswith('/services/') and not p.username and not p.query and not p.fragment, 'Invalid SLACK_WEBHOOK_URL')
        if self.bot_mode == 'turnstile':
            require(self.turnstile_secret_key and self.turnstile_hostnames, 'Turnstile configuration required')
        if prod:
            require(self.notification_mode=='live' and self.bot_mode=='turnstile' and self.worker_enabled, 'Production requires live delivery, bot verification and worker')
            require(not self.local_provider_base_url, 'Local provider forbidden in production')
            require(self.mongo_url.startswith('mongodb+srv://'), 'Production requires TLS Atlas connection')
            require(re.fullmatch(r'[0-9a-f]{40}',self.app_git_sha), 'APP_GIT_SHA must identify release')
            for name in ('newsletter_signing_key','rate_limit_hmac_key'):
                value=getattr(self,name)
                require(len(value)>=32 and not any(x in value.lower() for x in ('local-only','changeme','example')), f'{name.upper()} must be a strong secret')
            require(self.newsletter_signing_key!=self.rate_limit_hmac_key, 'Keys must be independent')
            require(self.notify_emails, 'Recipients required')
            for value in (self.sender_email,self.support_email,*self.notify_emails):
                require(re.fullmatch(r'[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+',value), 'Invalid notification address')
            require(self.sender_email.rsplit('@',1)[-1].lower() not in ('gmail.com','yahoo.com','outlook.com','hotmail.com'), 'Sender must use owned domain')
