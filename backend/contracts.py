"""One versioned form registry consumed by both browser and API."""
import json
from pathlib import Path

CONTRACT_PATH = Path(__file__).resolve().parents[1] / 'frontend/src/data/intake-contract.json'

def validate_contract(document):
    seen = set()
    if not isinstance(document.get('version'), str) or not document.get('types'):
        raise ValueError('Invalid intake contract')
    for kind in document['types']:
        if kind['id'] in seen:
            raise ValueError('Duplicate enquiry type')
        seen.add(kind['id'])
        ids = set()
        for field in kind['fields']:
            if field['id'] in ids or field['type'] not in ('text','email','tel','textarea'):
                raise ValueError('Invalid or duplicate enquiry field')
            ids.add(field['id'])
            if not isinstance(field['maxLength'],int) or not 0 < field['maxLength'] <= 5000:
                raise ValueError('Invalid field limit')
        if 'email' not in ids:
            raise ValueError('Email required in enquiry contract')
    return document

def load_contract(path=CONTRACT_PATH):
    return validate_contract(json.loads(path.read_text()))

CONTRACT = load_contract()
CONTACT_TYPES = {kind['id']: kind for kind in CONTRACT['types']}
