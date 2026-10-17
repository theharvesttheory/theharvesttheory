"""Strict, versioned public intake validation with non-sensitive errors."""
import hashlib
import json
import re
from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from contracts import CONTRACT, CONTACT_TYPES

class IntakeValidationError(ValueError):
    def __init__(self, field='form', message='Please enter a valid value.'):
        super().__init__('Invalid submission')
        self.fields = [{'field':field,'message':message}]

class EnquiryInput(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)
    type: str = Field(max_length=32)
    fields: dict[str,str]
    privacy_notice_version: str = Field(max_length=32)
    source_path: str = Field(max_length=256)
    website: str = Field(default='',max_length=500)
    turnstile_token: str = Field(default='',max_length=2048)


def normalize_email(value, *, allow_test_domains=False):
    value = value.strip()
    if len(value) > 254:
        raise IntakeValidationError('email')
    try:
        return validate_email(value, check_deliverability=False,
                              test_environment=allow_test_domains).normalized.lower()
    except EmailNotValidError:
        raise IntakeValidationError('email','Please enter a valid email address.') from None


def validate_source(value):
    if not re.fullmatch(r'/[A-Za-z0-9/_-]*', value) or value.startswith('//') or len(value)>256:
        raise IntakeValidationError('source_path')
    return value


def normalize_enquiry(payload, *, allow_test_domains=False):
    try:
        envelope = EnquiryInput.model_validate(payload)
    except ValidationError as exc:
        location = exc.errors(include_input=False, include_context=False)[0]['loc']
        field = location[0] if location and location[0] in EnquiryInput.model_fields else 'form'
        raise IntakeValidationError(field) from None
    schema = CONTACT_TYPES.get(envelope.type)
    if schema is None:
        raise IntakeValidationError('type','Choose an enquiry type.')
    if envelope.privacy_notice_version != CONTRACT['version']:
        raise IntakeValidationError('privacy_notice_version','Refresh this page before submitting.')
    validate_source(envelope.source_path)
    allowed = {f['id']:f for f in schema['fields']}
    if envelope.fields.keys() - allowed.keys():
        raise IntakeValidationError('fields','Unknown enquiry field.')
    normalized = {}
    for name, field in allowed.items():
        value = envelope.fields.get(name,'').strip()
        if not value and field.get('required'):
            raise IntakeValidationError(name,'This field is required.')
        if len(value) > field['maxLength']:
            raise IntakeValidationError(name,f'Use at most {field["maxLength"]} characters.')
        if value:
            normalized[name] = normalize_email(value,allow_test_domains=allow_test_domains) if name=='email' else value
    result=envelope.model_dump(); result['fields']=normalized
    return result


def payload_hash(normalized):
    business = {key:normalized[key] for key in ('type','fields','privacy_notice_version','source_path')}
    canonical=json.dumps(business,sort_keys=True,separators=(',',':'),ensure_ascii=False)
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()

class NewsletterInput(BaseModel):
    model_config=ConfigDict(extra='forbid',strict=True)
    email: str = Field(max_length=254)
    consent: bool
    privacy_notice_version: str = Field(max_length=32)
    source_path: str = Field(max_length=256)
    website: str = Field(default='',max_length=500)
    turnstile_token: str = Field(default='',max_length=2048)


def normalize_newsletter(payload, *, allow_test_domains=False):
    try:
        data=NewsletterInput.model_validate(payload)
    except ValidationError:
        raise IntakeValidationError() from None
    if data.consent is not True:
        raise IntakeValidationError('consent','Please choose whether to receive the newsletter.')
    if data.privacy_notice_version!=CONTRACT['version']:
        raise IntakeValidationError('privacy_notice_version','Refresh this page before submitting.')
    validate_source(data.source_path)
    result=data.model_dump();result['email']=normalize_email(data.email,allow_test_domains=allow_test_domains)
    return result
