import { useEffect, useRef, useState, useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { requestNewsletter } from '@/lib/intakeApi';
import contract from '@/data/intake-contract.json';

export default function Newsletter() {
  const [email,setEmail]=useState(''); const [consent,setConsent]=useState(false);
  const [website,setWebsite]=useState(''); const [status,setStatus]=useState('idle');
  const [error,setError]=useState(''); const request=useRef(null); const statusRef=useRef(null);
  const id=useId(); const location=useLocation();
  useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);
  useEffect(()=>{if(status==='success'||status==='error')statusRef.current?.focus();},[status]);
  async function submit(event) {
    event.preventDefault(); if(request.current||!consent||!email)return;
    const controller=new AbortController();request.current=controller;setStatus('submitting');setError('');
    try {
      await requestNewsletter({body:{email,consent,privacy_notice_version:contract.version,source_path:location.pathname,website,turnstile_token:''},signal:controller.signal});
      if(request.current===controller&&!controller.signal.aborted)setStatus('success');
    } catch(failure) {
      if(request.current===controller&&!controller.signal.aborted){setError(failure.message);setStatus('error');}
    } finally {if(request.current===controller)request.current=null;}
  }
  if(status==='success')return <p ref={statusRef} tabIndex={-1} role="status" aria-live="polite" data-testid="newsletter-success" className="mt-6 text-sm font-light text-cream/85">Check your email to confirm your subscription.</p>;
  return <form id="newsletter" data-testid="newsletter-form" onSubmit={submit} className="mt-6">
    <p className="text-[11px] uppercase tracking-[0.24em] text-cream/70">The seasonal letter</p>
    <label htmlFor={`${id}-email`} className="mt-4 block text-sm text-cream/85">Email address</label>
    <input id={`${id}-email`} data-testid="newsletter-input" type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={status==='submitting'} placeholder="Your email" className="w-full max-w-xs border-b border-cream/25 bg-transparent py-3 text-sm font-light text-cream placeholder:text-cream/60 focus:outline-gold" />
    <label className="mt-4 flex max-w-xs items-start gap-2 text-sm text-cream/85">
      <input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)} disabled={status==='submitting'} className="mt-1" />
      <span>I agree to receive The Harvest Theory newsletter. I can unsubscribe at any time.</span>
    </label>
    <p className="mt-3 text-xs text-cream/80">Read our <Link className="underline" to="/privacy">Privacy Policy</Link>.</p>
    <div className="hidden" aria-hidden="true"><label htmlFor={`${id}-website`}>Leave this field blank</label><input id={`${id}-website`} value={website} onChange={e=>setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
    {status==='error'&&<p ref={statusRef} tabIndex={-1} role="alert" className="mt-4 text-sm text-cream">{error||'Please try again later.'}</p>}
    <button type="submit" data-testid="newsletter-submit" aria-label="Subscribe" disabled={status==='submitting'} className="mt-4 flex items-center gap-2 border border-cream/40 px-4 py-2 text-sm text-cream transition-colors hover:text-gold disabled:opacity-60">
      {status==='submitting'?'Sending…':'Subscribe'}<ArrowRight size={16} strokeWidth={1.5}/>
    </button>
  </form>;
}
