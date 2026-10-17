from urllib.parse import urlsplit
import httpx
from .common import Outcome, retry_after, quiet_transport_logging

class SlackAdapter:
    def __init__(self, client, url):
        parsed = urlsplit(url)
        if (parsed.scheme != 'https' or parsed.hostname != 'hooks.slack.com'
                or parsed.username or parsed.password or parsed.port not in (None,443)
                or not parsed.path.startswith('/services/') or parsed.query or parsed.fragment):
            raise ValueError('Invalid Slack webhook destination')
        self.client = client
        self.url = url
        quiet_transport_logging()

    async def send(self, job):
        try:
            response = await self.client.post(self.url, json=job['payload'], timeout=10, follow_redirects=False)
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.PoolTimeout):
            return Outcome('retryable', 'connection_unavailable')
        except httpx.HTTPError:
            return Outcome('unknown', 'transport_ambiguous')
        status = response.status_code
        if status == 200:
            if response.text.strip() == 'ok': return Outcome('accepted', 'provider_accepted')
            return Outcome('unknown', 'invalid_acceptance')
        if status == 429 or status >= 500:
            return Outcome('retryable', f'http_{status}', retry_after=retry_after(response.headers.get('Retry-After')))
        return Outcome('permanent', f'http_{status}')
