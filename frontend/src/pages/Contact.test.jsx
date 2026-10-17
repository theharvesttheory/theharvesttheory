import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contact from './Contact';
import { CONTACT_TYPES } from '../data/contact-options';
import { submitEnquiry } from '../lib/intakeApi';
jest.mock('../lib/intakeApi',()=>({...jest.requireActual('../lib/intakeApi'),submitEnquiry:jest.fn()}));
jest.mock('framer-motion',()=>{const React=require('react');return {AnimatePresence:({children})=>children,motion:new Proxy({}, {get:(_,tag)=>React.forwardRef(({children,initial,animate,exit,transition,whileInView,viewport,...props},ref)=>React.createElement(tag,{...props,ref},children))})};});
const receipt={status:'received',id:'b769038c-d26a-4aa6-b8bf-23d818089e43'};
const mount=(url='/contact')=>render(<MemoryRouter initialEntries={[url]}><Contact /></MemoryRouter>);
function fill(schema){for(const field of schema.fields)fireEvent.change(screen.getByTestId(`contact-field-${field.id}`),{target:{value:field.id==='email'?'visitor@example.test':`Test ${field.id}`}});}
beforeEach(()=>submitEnquiry.mockReset());
test.each(CONTACT_TYPES)('$id waits for receipt and submits its schema',async schema=>{
 let resolve;submitEnquiry.mockReturnValue(new Promise(r=>{resolve=r;}));mount();fireEvent.click(screen.getByTestId(`contact-type-${schema.id}`));fill(schema);
 fireEvent.submit(screen.getByTestId('contact-form'));
 expect(submitEnquiry).toHaveBeenCalledTimes(1);expect(submitEnquiry.mock.calls[0][0].body.type).toBe(schema.id);
 expect(Object.keys(submitEnquiry.mock.calls[0][0].body.fields).sort()).toEqual(schema.fields.map(f=>f.id).sort());
 expect(screen.queryByTestId('contact-success')).not.toBeInTheDocument();expect(screen.getByTestId('contact-submit')).toBeDisabled();expect(screen.getByTestId('contact-type-general')).toBeDisabled();
 await act(async()=>resolve(receipt));expect(await screen.findByTestId('contact-success')).toHaveTextContent(receipt.id);
 if(schema.id==='product-orders')expect(screen.getByTestId('contact-success')).toHaveTextContent('Your product enquiry has been received');
});
test('failure retains values, focuses summary and unchanged retry reuses key; edits replace it',async()=>{
 submitEnquiry.mockRejectedValue(Object.assign(Error('Retry with the same details'),{fields:['email']}));mount('/contact?type=general');fill(CONTACT_TYPES.find(t=>t.id==='general'));
 fireEvent.submit(screen.getByTestId('contact-form'));await waitFor(()=>expect(screen.getByRole('alert')).toHaveFocus());
 expect(screen.getByTestId('contact-field-email')).toHaveValue('visitor@example.test');expect(screen.getByTestId('contact-field-email')).toHaveAttribute('aria-invalid','true');
 const key=submitEnquiry.mock.calls[0][0].idempotencyKey;
 fireEvent.submit(screen.getByTestId('contact-form'));await waitFor(()=>expect(submitEnquiry).toHaveBeenCalledTimes(2));
 await waitFor(()=>expect(screen.getByTestId('contact-submit')).not.toBeDisabled());expect(submitEnquiry.mock.calls[1][0].idempotencyKey).toBe(key);
 fireEvent.change(screen.getByTestId('contact-field-name'),{target:{value:'Edited'}});fireEvent.submit(screen.getByTestId('contact-form'));
 await waitFor(()=>expect(submitEnquiry).toHaveBeenCalledTimes(3));expect(submitEnquiry.mock.calls[2][0].idempotencyKey).not.toBe(key);
 await screen.findByRole('alert');
});
test('prefill and unmount abort; late response cannot update new form',async()=>{
 let resolve;submitEnquiry.mockReturnValue(new Promise(r=>{resolve=r;}));const view=mount('/contact?type=product-orders&item=Golden%20Latte');expect(screen.getByTestId('contact-field-products')).toHaveValue('Golden Latte');
 fireEvent.submit(screen.getByTestId('contact-form'));const signal=submitEnquiry.mock.calls[0][0].signal;view.unmount();expect(signal.aborted).toBe(true);
 mount('/contact?type=general');await act(async()=>resolve(receipt));expect(screen.queryByTestId('contact-success')).not.toBeInTheDocument();
});
