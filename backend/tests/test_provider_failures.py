from uuid import uuid4
from pymongo.errors import AutoReconnect
from test_enquiry_validation import body

def test_http_lost_database_acknowledgement_then_same_key_replay(client,monkeypatch):
    repo=client.app.state.repository;insert=repo.insert_enquiry;key={'Idempotency-Key':str(uuid4())}
    async def lost(document):
        await insert(document);raise AutoReconnect('Synthetic acknowledgement loss')
    monkeypatch.setattr(repo,'insert_enquiry',lost)
    response=client.post('/api/enquiries',json=body(),headers=key)
    assert response.status_code==503 and 'id' not in response.json()
    monkeypatch.setattr(repo,'insert_enquiry',insert)
    replay=client.post('/api/enquiries',json=body(),headers=key)
    assert replay.status_code==200 and replay.json()['status']=='received'
    assert client.portal.call(repo.db.enquiries.count_documents,{})==1
    record=client.portal.call(repo.db.enquiries.find_one,{'_id':replay.json()['id']})
    assert len(record['jobs'])==2
