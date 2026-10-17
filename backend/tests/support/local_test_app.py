"""Local harness-only fault seams. Never used by the production start command."""
import json
import os
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from pymongo.errors import AutoReconnect
from config import Settings
from repository import MongoRepository
from server import create_app

settings=Settings.from_env()
if settings.app_env!='test' or not settings.db_name.startswith('tht_local_'):
    raise RuntimeError('Local test app requires an isolated harness namespace')
fault_file=Path(os.environ['HARVEST_LOCAL_FAULT_FILE']).resolve()
if Path(__file__).resolve().parents[3]/'.local' not in fault_file.parents:
    raise RuntimeError('Fault controls must remain in the private local directory')

class FaultRepository(MongoRepository):
    async def insert_enquiry(self,document):
        control=json.loads(fault_file.read_text()) if fault_file.exists() else {}
        if control.get('save')=='before':raise AutoReconnect('Synthetic pre-commit failure')
        await super().insert_enquiry(document)
        if control.get('save')=='after':raise AutoReconnect('Synthetic lost acknowledgement')

app=create_app(settings=settings,repository_factory=FaultRepository)
