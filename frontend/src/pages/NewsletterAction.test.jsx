import React, { StrictMode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NewsletterAction from './NewsletterAction';
import { confirmNewsletter, unsubscribeNewsletter } from '../lib/intakeApi';
jest.mock('../lib/intakeApi',()=>({confirmNewsletter:jest.fn(),unsubscribeNewsletter:jest.fn()}));
beforeEach(()=>{confirmNewsletter.mockReset();unsubscribeNewsletter.mockReset();window.history.replaceState({},'', '/');});
test.each([['confirm','Confirm subscription','subscribed'],['unsubscribe','Unsubscribe','unsubscribed']])('explicit %s works in StrictMode without render mutation',async(action,label,state)=>{
 window.history.replaceState({},'',`/newsletter/${action}#token=private-signed-token`);
 const api=action==='confirm'?confirmNewsletter:unsubscribeNewsletter;api.mockResolvedValue({status:state});
 render(<StrictMode><MemoryRouter><NewsletterAction action={action}/></MemoryRouter></StrictMode>);
 expect(api).not.toHaveBeenCalled();expect(window.location.hash).toBe('');expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
 fireEvent.click(screen.getByRole('button',{name:label}));await waitFor(()=>expect(api).toHaveBeenCalledTimes(1));
 expect(api.mock.calls[0][0].token).toBe('private-signed-token');expect(await screen.findByTestId('newsletter-action-success')).toHaveTextContent(state==='subscribed'?'Subscription confirmed':'unsubscribed');
});
test('missing and expired links show safe recovery and no automatic action',async()=>{
 const view=render(<MemoryRouter><NewsletterAction action="confirm"/></MemoryRouter>);
 expect(screen.queryByRole('button',{name:'Confirm subscription'})).not.toBeInTheDocument();expect(confirmNewsletter).not.toHaveBeenCalled();view.unmount();
 window.history.replaceState({},'', '/newsletter/confirm#token=expired');confirmNewsletter.mockRejectedValue(Object.assign(Error('Invalid'),{status:400}));
 render(<MemoryRouter><NewsletterAction action="confirm"/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Confirm subscription'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('expired');expect(screen.getByRole('link',{name:/new confirmation/i})).toHaveAttribute('href','/#newsletter');
});
