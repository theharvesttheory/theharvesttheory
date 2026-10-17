"""Loopback-only simulator transport. Never reports real provider acceptance."""
from urllib.parse import urlsplit
import httpx
from .common import Outcome, retry_after

class LocalAdapter:
    def __init__(self,client,settings,channel):
        p=urlsplit(settings.local_provider_base_url)
        if settings.app_env not in ('local','test') or p.scheme!='http' or p.hostname not in ('127.0.0.1','localhost','::1') or p.username or p.password:
            raise ValueError('Simulator requires local mode and loopback HTTP')
        self.client=client;self.base=settings.local_provider_base_url.rstrip('/');self.channel=channel

    async def send(self,job):
        try:
            response=await self.client.post(f'{self.base}/{self.channel}',json={'job_id':job['job_id'],'payload':job['payload']},timeout=10,follow_redirects=False)
            if response.status_code==200:
                provider_id=response.json().get('id')
                if isinstance(provider_id,str) and provider_id.startswith('fake-'):
                    return Outcome('simulated','local_simulated',provider_id)
                return Outcome('unknown','invalid_simulation_response')
            if response.status_code==429 or response.status_code>=500:
                return Outcome('retryable','simulator_unavailable',retry_after=retry_after(response.headers.get('Retry-After')))
            return Outcome('permanent','simulator_rejected')
        except (httpx.ConnectError,httpx.ConnectTimeout):
            return Outcome('retryable','simulator_unavailable')
        except (httpx.HTTPError,ValueError,AttributeError):
            return Outcome('unknown','simulation_ambiguous')
