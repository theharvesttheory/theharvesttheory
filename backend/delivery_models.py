"""Persistent job snapshots; constructing a job never performs delivery."""
from copy import deepcopy
from uuid import uuid4


def new_job(channel, payload, generation, now):
    return {'job_id':str(uuid4()), 'generation':generation, 'channel':channel,
            'payload':deepcopy(payload), 'template_version':1, 'state':'pending',
            'attempts':0, 'next_attempt_at':now, 'first_attempt_at':None,
            'lease_owner':None, 'lease_until':None, 'accepted_at':None,
            'provider_id':None, 'error_code':None}
