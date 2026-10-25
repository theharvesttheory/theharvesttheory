import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { confirmNewsletter, unsubscribeNewsletter } from '@/lib/intakeApi';
import { Page } from '@/components/Reveal';

export default function NewsletterAction({ action }) {
  // Capture in state before effects remove the fragment. StrictMode replays effects,
  // so a cleanup/remount must not read an already-cleared address bar.
  const [token]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('token')||'');
  const [status,setStatus]=useState('idle');const [error,setError]=useState('');
  const request=useRef(null);const result=useRef(null);
  useEffect(()=>{
    window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
    const nodes=[];
    for(const [name,content] of [['robots','noindex, nofollow'],['referrer','no-referrer']]){
      const node=document.createElement('meta');node.name=name;node.content=content;document.head.appendChild(node);nodes.push(node);
    }
    return ()=>{nodes.forEach(n=>n.remove());request.current?.abort();request.current=null;};
  },[]);
  useEffect(()=>{if(status==='success'||status==='error')result.current?.focus();},[status]);
  const confirm=action==='confirm';
  async function submit(){
    if(!token||request.current)return;
    const controller=new AbortController();request.current=controller;setStatus('submitting');
    try{
      await (confirm?confirmNewsletter:unsubscribeNewsletter)({token,signal:controller.signal});
      if(request.current===controller&&!controller.signal.aborted)setStatus('success');
    }catch(failure){
      if(request.current===controller&&!controller.signal.aborted){setError(failure.status===400?'This link has expired or is no longer valid. Request a new confirmation email below.':failure.message);setStatus('error');}
    }finally{if(request.current===controller)request.current=null;}
  }
  return <Page className="limewash"><div className="mx-auto max-w-2xl px-6 pb-28 pt-40">
    <p className="eyebrow">The seasonal letter</p>
    <h1 className="mt-6 font-display text-4xl text-ink">{confirm?'Confirm your subscription':'Unsubscribe from the newsletter'}</h1>
    {status==='success'?<p data-testid="newsletter-action-success" ref={result} tabIndex={-1} role="status" className="mt-8 text-lg">{confirm?'Subscription confirmed. Thank you for joining us.':'You have been unsubscribed.'}</p>:<>
      <p className="mt-8 text-ink/80">{token?'Use the button below to complete this action.':'This link is missing its confirmation token. Open the full link from your email or request a new confirmation.'}</p>
      {status==='error'&&<p ref={result} tabIndex={-1} role="alert" className="mt-6 text-red-800">{error}</p>}
      {status==='submitting'&&<p role="status" className="mt-6 text-ink/80">Please keep this page open. Your request may take up to 90 seconds.</p>}
      {token&&<button type="button" className="btn-primary mt-8" onClick={submit} disabled={status==='submitting'}>{status==='submitting'?'Please wait…':confirm?'Confirm subscription':'Unsubscribe'}</button>}
    </>}
    <p className="mt-8"><Link className="underline" to="/#newsletter">Request a new confirmation email</Link></p>
  </div></Page>;
}
