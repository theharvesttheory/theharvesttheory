"""Persisted retry decisions. A retry window never restarts with the process."""
from datetime import timedelta
from random import random as default_random

BACKOFF=(5,30,120,600,1800,7200)
WINDOW=timedelta(hours=23)

def stopped(job,code):
    return {'state':'unknown' if job.get('ambiguous') else 'dead',
            'automatic_paused':True,'error_code':code}

def preflight(job,now,max_attempts):
    if job.get('automatic_paused'):return stopped(job,'manual_reconciliation_required')
    if job.get('first_attempt_at') and now-job['first_attempt_at']>=WINDOW:
        return stopped(job,'automatic_window_elapsed')
    if job['attempts']>max_attempts:return stopped(job,'attempts_exhausted')
    return None

def transition(job,outcome,now,max_attempts,random=default_random):
    if outcome.kind in ('accepted','simulated'):
        return {'state':outcome.kind,'accepted_at':now,'provider_id':outcome.provider_id,
                'error_code':None,'automatic_paused':False,'ambiguous':False}
    ambiguous=job.get('ambiguous',False) or outcome.kind=='unknown'
    current={**job,'ambiguous':ambiguous}
    if outcome.kind=='permanent':return {**stopped(current,outcome.code),'ambiguous':ambiguous}
    if job['attempts']>=max_attempts:
        return {**stopped(current,'attempts_exhausted'),'ambiguous':ambiguous}
    elapsed=preflight(current,now,max_attempts)
    if elapsed:return {**elapsed,'ambiguous':ambiguous}
    base=BACKOFF[min(max(job['attempts']-1,0),len(BACKOFF)-1)]
    delay=min(7200,max(base*(.8+.4*random()),outcome.retry_after))
    due=now+timedelta(seconds=delay)
    if due>=job['first_attempt_at']+WINDOW:
        return {**stopped(current,'automatic_window_elapsed'),'ambiguous':ambiguous}
    return {'state':'unknown' if ambiguous else 'retry','next_attempt_at':due,
            'error_code':outcome.code,'ambiguous':ambiguous,'automatic_paused':False}
