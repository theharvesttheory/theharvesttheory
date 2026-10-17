from dataclasses import replace
from datetime import timedelta
from uuid import uuid4
import pytest
from contracts import CONTACT_TYPES
from models import normalize_enquiry
from test_enquiry_validation import body

@pytest.mark.parametrize('kind',list(CONTACT_TYPES))
def test_enquiry_jobs_have_escaped_email_and_minimal_slack(settings,clock,kind):
    from notifications.rendering import build_enquiry_jobs
    value=body(kind)
    for key in value['fields']:
        if key!='email':value['fields'][key]='<script>alert("x")</script> <!channel>'
    normalized=normalize_enquiry(value)
    reference=str(uuid4());jobs=build_enquiry_jobs(normalized,reference,settings,clock())
    mail=jobs['ops_email']['payload'];slack=jobs['slack']['payload']
    assert reference in mail['subject'] and kind in mail['subject']
    assert '<script>' not in mail['html'] and '&lt;script&gt;' in mail['html']
    assert mail['reply_to']=='person@example.com'
    assert mail['to']==list(settings.notify_emails)
    assert reference in str(slack)
    assert 'person@example.com' not in str(slack) and '<!channel>' not in str(slack)
    assert all(b['text']['type']=='plain_text' for b in slack['blocks'])
    assert all(j['state']=='pending' for j in jobs.values())


def test_visitor_cannot_override_destinations_or_subject(settings,clock):
    from notifications.rendering import build_enquiry_jobs
    value=normalize_enquiry(body());value['fields'].update(to='evil@example.com',subject='Injected',webhook='https://evil.example.com')
    mail=build_enquiry_jobs(value,str(uuid4()),settings,clock())['ops_email']['payload']
    assert mail['to']==list(settings.notify_emails) and 'Injected' not in mail['subject']
    assert 'evil@example.com' not in mail['html']


def test_header_controls_are_rejected(settings,clock):
    from notifications.rendering import build_enquiry_jobs
    bad=replace(settings,email_from_name='Harvest\r\nBcc: evil@example.com')
    with pytest.raises(ValueError):build_enquiry_jobs(normalize_enquiry(body()),str(uuid4()),bad,clock())


def test_newsletter_email_has_narrow_fragment_action_links(settings,clock):
    from notifications.rendering import build_confirmation_job
    record={'_id':str(uuid4()),'generation':str(uuid4()),'email':'person@example.test',
        'generation_created_at':clock(),'confirmation_expires_at':clock()+timedelta(hours=24)}
    job=build_confirmation_job(record,settings,clock());payload=job['payload']
    assert payload['to']==['person@example.test']
    assert '/newsletter/confirm#token=' in payload['text']
    assert '/newsletter/unsubscribe#token=' in payload['text']
    assert '?token=' not in payload['text']
    assert payload['reply_to']==settings.support_email


def test_payload_is_an_immutable_snapshot(settings,clock):
    from notifications.rendering import build_enquiry_jobs
    value=normalize_enquiry(body())
    job=build_enquiry_jobs(value,str(uuid4()),settings,clock())['ops_email']
    before=job['payload']['html'];value['fields']['message']='Changed after construction'
    assert job['payload']['html']==before
