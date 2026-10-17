"""Render once before persistence. Delivery retries never rebuild these payloads."""
from html import escape
from uuid import UUID
from contracts import CONTACT_TYPES
from delivery_models import new_job
from newsletter_tokens import create_action_token


def header(value):
    if not isinstance(value,str) or any(ord(c)<32 or ord(c)==127 for c in value):
        raise ValueError('Invalid notification header configuration')
    return value


def email(settings,subject,rows,to=None,reply_to=None):
    subject=header(subject)
    sender=f'{header(settings.email_from_name)} <{header(settings.sender_email)}>'
    rows=[(str(label),str(value)) for label,value in rows if value]
    html='<!doctype html><html><body><h1>'+escape(subject)+'</h1><dl>'
    html+=''.join(f'<dt>{escape(label)}</dt><dd style="white-space:pre-wrap">{escape(value)}</dd>' for label,value in rows)
    html+='</dl></body></html>'
    result={'from':sender,'to':[header(x) for x in (to or settings.notify_emails)],
            'subject':subject,'html':html,'text':subject+'\n\n'+'\n'.join(f'{label}: {value}' for label,value in rows)}
    if reply_to:result['reply_to']=header(reply_to)
    return result


def slack(label,reference,now):
    text=f'The Harvest Theory | {label}\nReference: {reference}\nReceived: {now.isoformat()}'
    return {'text':f'Harvest | {label} | {reference}',
            'blocks':[{'type':'section','text':{'type':'plain_text','text':text,'emoji':False}}]}


def build_enquiry_jobs(normalized,reference,settings,now):
    reference=str(UUID(reference));kind=normalized['type'];schema=CONTACT_TYPES[kind]
    rows=[('Reference',reference),('Enquiry type',schema['label']),('Received',now.isoformat())]
    rows.extend((f['label'],normalized['fields'].get(f['id'],'')) for f in schema['fields'])
    mail=email(settings,f'Harvest enquiry | {kind} | {reference}',rows,
               reply_to=normalized['fields']['email'])
    return {'ops_email':new_job('ops_email',mail,'initial',now),
            'slack':new_job('slack',slack(schema['label'],reference,now),'initial',now)}


def build_confirmation_job(record,settings,now):
    confirm=create_action_token(record,'confirm',settings)
    unsubscribe=create_action_token(record,'unsubscribe',settings)
    base=settings.public_frontend_url.rstrip('/')
    confirm_url=f'{base}/newsletter/confirm#token={confirm}'
    unsubscribe_url=f'{base}/newsletter/unsubscribe#token={unsubscribe}'
    payload=email(settings,'Confirm your Harvest Theory newsletter',[],to=[record['email']],reply_to=settings.support_email)
    payload['text']=('Confirm your subscription to The Harvest Theory seasonal letter.\n\n'
        f'Confirm: {confirm_url}\n\nUnsubscribe or cancel this request: {unsubscribe_url}\n\n'
        'The confirmation link expires in 24 hours. If you did not request this, you can ignore this email.')
    payload['html']=('<!doctype html><html><body><h1>Confirm your subscription</h1>'
        '<p>Receive The Harvest Theory seasonal letter.</p>'
        f'<p><a href="{escape(confirm_url,quote=True)}">Confirm subscription</a></p>'
        f'<p><a href="{escape(unsubscribe_url,quote=True)}">Unsubscribe or cancel this request</a></p>'
        '<p>The confirmation link expires in 24 hours. If you did not request this, you can ignore this email.</p></body></html>')
    return new_job('confirmation_email',payload,record['generation'],now)


def build_newsletter_ops_jobs(record,settings,now):
    reference=str(UUID(record['_id']))
    mail=email(settings,f'Harvest newsletter confirmation | {reference}',
        [('Reference',reference),('Email',record['email']),('Confirmed',now.isoformat())])
    return {'ops_email':new_job('ops_email',mail,record['generation'],now),
            'slack':new_job('slack',slack('Newsletter subscription confirmed',reference,now),record['generation'],now)}
