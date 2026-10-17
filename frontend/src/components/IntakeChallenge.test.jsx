import React, { createRef } from 'react';
import { render, act, waitFor, screen, cleanup } from '@testing-library/react';
import IntakeChallenge, { loadTurnstile, validateChallengeConfig } from './IntakeChallenge';
beforeEach(()=>{delete window.turnstile;document.querySelectorAll('script[data-harvest-turnstile]').forEach(n=>n.remove());process.env.REACT_APP_TURNSTILE_MODE='live';process.env.REACT_APP_TURNSTILE_SITE_KEY='test-public-key';});
afterEach(()=>{cleanup();delete process.env.REACT_APP_TURNSTILE_MODE;delete process.env.REACT_APP_TURNSTILE_SITE_KEY;});
test('one script loader shared across callers, with recoverable load error',async()=>{
 const a=loadTurnstile();const b=loadTurnstile();expect(a).toBe(b);expect(document.querySelectorAll('script[data-harvest-turnstile]')).toHaveLength(1);
 const rejection=expect(a).rejects.toThrow();document.querySelector('script[data-harvest-turnstile]').dispatchEvent(new Event('error'));await rejection;
 const c=loadTurnstile();window.turnstile={render:jest.fn()};document.querySelector('script[data-harvest-turnstile]').dispatchEvent(new Event('load'));await expect(c).resolves.toBe(window.turnstile);
});
test('separate widgets/actions, expiry reset and cleanup',async()=>{
 const callbacks=[];window.turnstile={render:jest.fn((node,options)=>{callbacks.push(options);return `widget-${callbacks.length}`;}),reset:jest.fn(),remove:jest.fn()};
 const onToken=jest.fn();const ref=createRef();const view=render(<><IntakeChallenge ref={ref} action="enquiry" onToken={onToken}/><IntakeChallenge action="newsletter" onToken={()=>{}}/></>);
 await waitFor(()=>expect(callbacks).toHaveLength(2));expect(callbacks.map(c=>c.action)).toEqual(['enquiry','newsletter']);
 act(()=>callbacks[0].callback('solved'));expect(onToken).toHaveBeenLastCalledWith('solved');act(()=>callbacks[0]['expired-callback']());expect(onToken).toHaveBeenLastCalledWith('');
 act(()=>ref.current.reset());expect(window.turnstile.reset).toHaveBeenCalledWith('widget-1');view.unmount();expect(window.turnstile.remove).toHaveBeenCalledTimes(2);
});
test('configuration never permits fake production or missing live key',()=>{
 expect(()=>validateChallengeConfig('fake','anything','production')).toThrow();expect(()=>validateChallengeConfig('live','','production')).toThrow();
});
test('load errors are visible and no token is issued',async()=>{
 const token=jest.fn();render(<IntakeChallenge action="enquiry" onToken={token}/>);
 document.querySelector('script[data-harvest-turnstile]').dispatchEvent(new Event('error'));
 expect(await screen.findByRole('alert')).toHaveTextContent('Verification could not load');expect(token).not.toHaveBeenCalledWith(expect.stringMatching(/.+/));
});
