import re
import httpx
from .common import Outcome, retry_after, quiet_transport_logging

class ResendAdapter:
    def __init__(self, client, key):
        self.client = client
        self.key = key
        quiet_transport_logging()

    async def send(self, job):
        try:
            response = await self.client.post('https://api.resend.com/emails',
                headers={'Authorization': f'Bearer {self.key}',
                         'Idempotency-Key': f"tht/{job['job_id']}"},
                json=job['payload'], timeout=10, follow_redirects=False)
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.PoolTimeout):
            return Outcome('retryable', 'connection_unavailable')
        except httpx.HTTPError:
            return Outcome('unknown', 'transport_ambiguous')
        status = response.status_code
        try:
            body = response.json()
            if not isinstance(body, dict): body = {}
        except ValueError:
            body = {}
        if 200 <= status < 300:
            provider_id = body.get('id')
            if isinstance(provider_id, str) and re.fullmatch(r'[A-Za-z0-9_-]{1,128}', provider_id):
                return Outcome('accepted', 'provider_accepted', provider_id)
            return Outcome('unknown', 'invalid_acceptance')
        if status == 429 or status >= 500:
            return Outcome('retryable', f'http_{status}', retry_after=retry_after(response.headers.get('Retry-After')))
        if status == 409 and body.get('name') == 'concurrent_idempotent_requests':
            return Outcome('retryable', 'idempotency_in_progress')
        return Outcome('permanent', f'http_{status}')
