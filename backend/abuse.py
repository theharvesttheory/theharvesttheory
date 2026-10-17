"""Shared intake quotas, independent of browser CORS and provider checks."""
from datetime import datetime, timezone, timedelta
import hashlib
import hmac
import ipaddress
from errors import APIError


def client_address(request, settings):
    peer=request.client.host if request.client else 'unresolved'
    try:
        address=ipaddress.ip_address(peer)
    except ValueError:
        return 'unresolved'
    networks=[ipaddress.ip_network(cidr) for cidr in settings.trusted_proxy_cidrs]
    def trusted(ip):
        return any(ip in network for network in networks)
    if not trusted(address):
        return str(address)
    chain=request.headers.get('x-forwarded-for','')
    if len(chain)>512:
        return str(address)
    try:
        forwarded=[ipaddress.ip_address(part.strip()) for part in chain.split(',') if part.strip()]
    except ValueError:
        return str(address)
    for candidate in reversed(forwarded):
        if not trusted(address): break
        address=candidate
    return str(address)


async def check_limit(repo,settings,scope,identity,limit,window_seconds,now):
    epoch=int(now.timestamp());bucket=epoch//window_seconds
    material=f'{scope}:{identity}:{bucket}'.encode()
    key=hmac.new(settings.rate_limit_hmac_key.encode(),material,hashlib.sha256).hexdigest()
    expires=datetime.fromtimestamp((bucket+1)*window_seconds,tz=timezone.utc)
    count=await repo.increment_rate(key,expires+timedelta(seconds=60))
    if count>limit:
        raise APIError(429,'rate_limited','Please wait before trying again.',
                       retry_after=max(1,int((expires-now).total_seconds())))


async def enforce_limits(request):
    state=request.app.state;settings=state.settings;now=state.clock()
    await check_limit(state.repository,settings,'ip',client_address(request,settings),
                      settings.ip_rate_limit,600,now)
    await check_limit(state.repository,settings,'global','all',settings.global_rate_limit,3600,now)


def reject_honeypot(normalized):
    if normalized.get('website','').strip():
        raise APIError(400,'verification_failed','Please refresh the form and try again.')
