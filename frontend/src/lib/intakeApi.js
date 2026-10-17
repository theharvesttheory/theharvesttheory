const MESSAGES = {
  400: 'Verification could not be completed. Please try again.',
  409: 'These details changed during a retry. Edit the form to start a new submission.',
  422: 'Please check the highlighted fields and try again.',
  429: 'Too many attempts. Please wait before trying again.',
  503: 'We could not confirm your submission. Please retry with the same details.',
};
export class IntakeError extends Error {
  constructor(message, options = {}) { super(message); this.name = 'IntakeError'; Object.assign(this, options); }
}
export function apiOrigin(value = process.env.REACT_APP_BACKEND_URL, environment = process.env.NODE_ENV) {
  if (!value && environment === 'production') throw new IntakeError('The form service is not configured. Please try later.');
  const url = new URL(value || 'http://127.0.0.1:8300');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new IntakeError('The form service is not configured. Please try later.');
  return url.origin;
}
function uuid() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function requestIdentity(previous, body) {
  const fields = Object.fromEntries(Object.entries(body.fields).sort(([a],[b]) => a.localeCompare(b)).map(([key,value]) => [key,key === 'email' ? value.trim().toLowerCase() : value.trim()]).filter(([,value]) => value));
  const snapshot = JSON.stringify({ type: body.type, fields, privacy_notice_version: body.privacy_notice_version, source_path: body.source_path });
  return previous?.snapshot === snapshot ? previous : { snapshot, key: uuid() };
}
async function post(path, body, signal, idempotencyKey) {
  const origin = apiOrigin();
  const controller = new AbortController(); let timedOut = false;
  const onAbort = () => controller.abort();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  signal?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
  try {
    const response = await fetch(`${origin}/api${path}`, {
      method: 'POST', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
      body: JSON.stringify(body), signal: controller.signal,
    });
    let data; try { data = await response.json(); } catch { data = null; }
    if (!response.ok) {
      const fields = Array.isArray(data?.error?.fields) ? data.error.fields.map(f => f?.field).filter(f => typeof f === 'string' && /^[a-z_]+$/.test(f)) : [];
      throw new IntakeError(MESSAGES[response.status] || 'Your submission could not be confirmed. Please try again.', { status: response.status, fields, retryAfter: Math.max(0, Math.min(7200, Number(response.headers.get('Retry-After')) || 0)) });
    }
    return { data, status: response.status };
  } catch (error) {
    if (timedOut) throw new IntakeError('The response took too long. Retry with the same details; your request may already be saved.', { code: 'timeout' });
    if (error.name === 'AbortError' || error instanceof IntakeError) throw error;
    throw new IntakeError('Connection interrupted. Retry with the same details; your request may already be saved.', { code: 'network' });
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', onAbort);
  }
}
function malformed() { throw new IntakeError('Your submission could not be confirmed. Please retry with the same details.', { code: 'invalid_receipt' }); }
export async function submitEnquiry({ body, idempotencyKey, signal }) {
  const { data, status } = await post('/enquiries', body, signal, idempotencyKey);
  if (![200,201].includes(status) || data?.status !== 'received' || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(data?.id || '')) malformed();
  return data;
}
export async function requestNewsletter({ body, signal }) {
  const { data, status } = await post('/newsletter', body, signal);
  if (status !== 202 || data?.status !== 'requested') malformed(); return data;
}
async function membership(action, expected, { token, signal }) {
  const { data, status } = await post(`/newsletter/${action}`, { token }, signal);
  if (status !== 200 || data?.status !== expected) malformed(); return data;
}
export const confirmNewsletter = options => membership('confirm', 'subscribed', options);
export const unsubscribeNewsletter = options => membership('unsubscribe', 'unsubscribed', options);
