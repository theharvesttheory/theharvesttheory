from uuid import uuid4
from datetime import timedelta
from delivery_models import new_job

def test_delivery_degraded_does_not_block_intake_readiness(client,clock):
    job=new_job('slack',{'text':'private synthetic'},'1',clock()-timedelta(minutes=6))
    client.portal.call(client.app.state.repository.db.enquiries.insert_one,{'_id':str(uuid4()),'idempotency_key':str(uuid4()),'jobs':{'slack':job}})
    response=client.get('/api/health/delivery')
    assert response.status_code==503 and response.json()=={'status':'degraded'}
    assert client.get('/api/health/ready').status_code==200

def test_empty_queue_healthy_and_status_has_no_counts(client):
    response=client.get('/api/health/delivery')
    assert response.status_code==200 and response.json()=={'status':'ok'}
