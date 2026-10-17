import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
let loading;
export function loadTurnstile() {
  if(window.turnstile?.render)return Promise.resolve(window.turnstile);
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.dataset.harvestTurnstile='true';
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;
    const timer=setTimeout(failed,15000);
    function failed(){clearTimeout(timer);script.remove();loading=undefined;reject(new Error('Verification could not load.'));}
    script.onerror=failed;
    script.onload=()=>{clearTimeout(timer);loading=undefined;if(window.turnstile?.render)resolve(window.turnstile);else failed();};
    document.head.appendChild(script);
  });
  return loading;
}
export function validateChallengeConfig(mode,key,environment=process.env.NODE_ENV){
  if(!['live','fake'].includes(mode)||(mode==='fake'&&environment==='production')||(mode==='live'&&!key))throw new Error('Verification is not configured. Please try later.');
}
const IntakeChallenge=forwardRef(function IntakeChallenge({action,onToken},ref){
  const mode=process.env.REACT_APP_TURNSTILE_MODE||(process.env.NODE_ENV==='production'?'live':'fake');
  const key=process.env.REACT_APP_TURNSTILE_SITE_KEY||'';
  const node=useRef(null);const widget=useRef(null);const callback=useRef(onToken);callback.current=onToken;
  const [error,setError]=useState('');const [reload,setReload]=useState(0);
  useImperativeHandle(ref,()=>({reset(){
    callback.current('');
    if(mode==='fake'&&process.env.NODE_ENV!=='production')callback.current(`local-${action}-${Date.now()}`);
    else if(widget.current!==null)window.turnstile?.reset(widget.current);
  }}),[mode,action]);
  useEffect(()=>{
    let active=true;callback.current('');setError('');
    try{validateChallengeConfig(mode,key);}catch(failure){setError(failure.message);return;}
    if(mode==='fake'){callback.current(`local-${action}-${Date.now()}`);return ()=>{active=false;};}
    loadTurnstile().then(api=>{
      if(!active)return;
      widget.current=api.render(node.current,{
        sitekey:key,action,size:'flexible',theme:'auto','response-field':false,
        callback:token=>{if(active){setError('');callback.current(token);}},
        'expired-callback':()=>{if(active)callback.current('');},
        'error-callback':()=>{if(active){callback.current('');setError('Verification failed. Please retry verification.');}return true;},
        'timeout-callback':()=>{if(active){callback.current('');setError('Verification timed out. Please retry verification.');}},
      });
    }).catch(()=>{if(active)setError('Verification could not load. Check your connection and retry verification.');});
    return ()=>{active=false;if(widget.current!==null){window.turnstile?.remove(widget.current);widget.current=null;}};
  },[action,key,mode,reload]);
  return <div className="mt-6" aria-label="Form verification">
    {mode==='fake'&&process.env.NODE_ENV!=='production'?<p className="text-xs opacity-75">Local preview: verification is simulated.</p>:<div ref={node}/>}
    {error&&<div role="alert" className="mt-2 text-sm"><p>{error}</p><button type="button" className="mt-2 underline" onClick={()=>setReload(x=>x+1)}>Retry verification</button></div>}
  </div>;
});
export default IntakeChallenge;
