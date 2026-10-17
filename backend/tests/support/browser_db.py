"""Private, namespace-guarded browser test observation and fault control."""
import json
from pathlib import Path
import sys
from pymongo import MongoClient
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'scripts'))
import importlib.util
spec=importlib.util.spec_from_file_location('harness',ROOT/'scripts/run-local.py');harness=importlib.util.module_from_spec(spec);spec.loader.exec_module(harness)

def main():
    state=json.loads((ROOT/'.local/test/state.json').read_text())
    if state['status']!='running' or state['database']!='tht_local_test_'+state['token']:raise ValueError('No isolated test stack')
    harness.validate_mongo_url(state['mongo_url']);directory=Path(state['directory']).resolve()
    if ROOT/'.local/test' not in directory.parents:raise ValueError('Invalid capture directory')
    action=sys.argv[1];value=sys.argv[2] if len(sys.argv)>2 else ''
    with MongoClient(state['mongo_url'],tz_aware=True) as client:
        db=client[state['database']]
        if action=='fault':
            if value not in ('before','after','clear'):raise ValueError('Invalid fault')
            (directory/'application-faults.json').write_text(json.dumps({} if value=='clear' else {'save':value}));result={'configured':True}
        elif action in ('rate-block','rate-reset'):
            result={'matched':db.rate_limits.update_many({}, {'$set':{'count':100000 if action=='rate-block' else 0}}).matched_count}
        elif action in ('enquiry','subscriber'):
            if not value.endswith('@example.test'):raise ValueError('Only synthetic test identities are allowed')
            collection=db.enquiries if action=='enquiry' else db.newsletter_subscribers
            query={'fields.email':value} if action=='enquiry' else {'email':value}
            rows=list(collection.find(query,{**{f'jobs.{slot}.payload':0 for slot in ('ops_email','slack','confirmation_email')},'job_history.payload':0}))
            result={'count':len(rows),'records':rows}
        else:raise ValueError('Unknown local test action')
        print(json.dumps(result,default=str))
if __name__=='__main__':main()
