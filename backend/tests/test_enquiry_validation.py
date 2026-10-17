from copy import deepcopy
import pytest
from contracts import CONTACT_TYPES

def body(kind='general'):
    fields = {f['id']: ('person@example.com' if f['id']=='email' else 'Hello')
              for f in CONTACT_TYPES[kind]['fields'] if f.get('required')}
    return {'type':kind,'fields':fields,'privacy_notice_version':'2026-10-17',
            'source_path':'/contact','website':'','turnstile_token':'token'}

@pytest.mark.parametrize('kind', list(CONTACT_TYPES))
def test_minimum_valid_body_for_every_type(kind):
    from models import normalize_enquiry
    assert normalize_enquiry(body(kind))['type'] == kind

CASES=[(k,f['id']) for k,t in CONTACT_TYPES.items() for f in t['fields'] if f.get('required')]
@pytest.mark.parametrize('kind,field', CASES)
def test_missing_required_field_is_rejected(kind,field):
    from models import normalize_enquiry, IntakeValidationError
    value=body(kind); del value['fields'][field]
    with pytest.raises(IntakeValidationError): normalize_enquiry(value)

@pytest.mark.parametrize('mutate', [
 lambda b:b.update(type='invented'), lambda b:b.update(extra='forbidden'),
 lambda b:b['fields'].update(invented='forbidden'), lambda b:b['fields'].update(name={}),
 lambda b:b['fields'].update(name=['text']), lambda b:b['fields'].update(name=12),
 lambda b:b['fields'].update(name='   '), lambda b:b['fields'].update(email='not-email'),
 lambda b:b.update(source_path='https://evil.example.com'),
 lambda b:b.update(source_path='//evil.example.com'),
 lambda b:b.update(source_path='/contact?email=private'),
 lambda b:b.update(source_path='/contact#token=private'),
 lambda b:b.update(source_path='/../escape'),
 lambda b:b.update(privacy_notice_version='old'),
])
def test_invalid_fields_are_rejected(mutate):
    from models import normalize_enquiry, IntakeValidationError
    value=body();mutate(value)
    with pytest.raises(IntakeValidationError): normalize_enquiry(value)

@pytest.mark.parametrize('field,limit', [('name',160),('message',5000)])
def test_text_exact_limit_and_overflow(field, limit):
    from models import normalize_enquiry, IntakeValidationError
    value=body();value['fields'][field]='x'*limit
    assert len(normalize_enquiry(value)['fields'][field]) == limit
    value['fields'][field]+='x'
    with pytest.raises(IntakeValidationError): normalize_enquiry(value)

@pytest.mark.parametrize('field,limit', [('phone',40),('products',500),('notes',5000)])
def test_optional_field_limits(field,limit):
    from models import normalize_enquiry, IntakeValidationError
    value=body('product-orders');value['fields'][field]='x'*limit
    assert len(normalize_enquiry(value)['fields'][field])==limit
    value['fields'][field]+='x'
    with pytest.raises(IntakeValidationError): normalize_enquiry(value)

def test_hash_is_canonical_and_excludes_challenge():
    from models import normalize_enquiry, payload_hash
    a=body();b=deepcopy(a)
    b['fields']={'message':'  Hello  ','email':'person@example.com','name':'Hello'}
    b['turnstile_token']='different';b['website']='bot'
    assert payload_hash(normalize_enquiry(a))==payload_hash(normalize_enquiry(b))
    b['fields']['message']='different'
    assert payload_hash(normalize_enquiry(a))!=payload_hash(normalize_enquiry(b))

def test_text_line_breaks_are_preserved_and_empty_optionals_omitted():
    from models import normalize_enquiry
    value=body('product-orders');value['fields'].update(notes='First\nSecond',phone='   ')
    fields=normalize_enquiry(value)['fields']
    assert fields['notes']=='First\nSecond'
    assert 'phone' not in fields
