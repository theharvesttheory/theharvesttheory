"""Safe outcomes; provider response bodies and transport errors never escape adapters."""
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import logging

@dataclass(frozen=True)
class Outcome:
    kind: str
    code: str
    provider_id: str | None = None
    retry_after: float = 0

def retry_after(value, now=None):
    now = now or datetime.now(timezone.utc)
    try:
        seconds = float(value)
    except (TypeError, ValueError):
        try:
            seconds = (parsedate_to_datetime(value) - now).total_seconds()
        except (TypeError, ValueError, OverflowError):
            return 0
    return max(0, min(7200, seconds))

def quiet_transport_logging():
    # HTTPX logs complete URLs at INFO, exposing Slack's bearer path.
    for name in ('httpx', 'httpcore'):
        logging.getLogger(name).disabled = True
        logging.getLogger(name).setLevel(logging.CRITICAL)
