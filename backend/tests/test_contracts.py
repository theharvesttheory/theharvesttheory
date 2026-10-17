from copy import deepcopy
import pytest

EXPECTED = {
 'product-orders': (['name','email'], ['phone','products','quantity','notes']),
 'general': (['name','email','message'], []),
 'retail': (['name','email'], ['company','city','business','products','volume','phone']),
 'gifting': (['company','email'], ['occasion','quantity','date','customisation','phone']),
 'export': (['company','email'], ['country','status','products','volume','phone']),
 'collaborations': (['name','email'], ['company','about','phone']),
 'press': (['publication','email'], ['subject','deadline','phone']),
 'wholesale': (['company','email'], ['products','volume','phone']),
 'sourcing': (['company','email'], ['offering','origin','certifications','capacity','phone']),
}

def test_all_nine_contracts_match_current_fields():
    from contracts import load_contract
    document = load_contract()
    assert document['version'] == '2026-10-17'
    assert set(EXPECTED) == {t['id'] for t in document['types']}
    for t in document['types']:
        required, optional = EXPECTED[t['id']]
        assert {f['id'] for f in t['fields'] if f.get('required')} == set(required)
        assert {f['id'] for f in t['fields'] if not f.get('required')} == set(optional)
        assert all(f['maxLength'] > 0 for f in t['fields'])

@pytest.mark.parametrize('duplicate', ['type','field'])
def test_duplicates_fail_contract_loading(duplicate):
    from contracts import load_contract, validate_contract
    document = deepcopy(load_contract())
    if duplicate == 'type': document['types'].append(document['types'][0])
    else: document['types'][0]['fields'].append(document['types'][0]['fields'][0])
    with pytest.raises(ValueError): validate_contract(document)
