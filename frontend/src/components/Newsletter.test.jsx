import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Newsletter from './Newsletter';
import { requestNewsletter } from '../lib/intakeApi';
jest.mock('../lib/intakeApi',()=>({requestNewsletter:jest.fn()}));
const mount=()=>render(<MemoryRouter><Newsletter /></MemoryRouter>);
beforeEach(()=>requestNewsletter.mockReset());
test('explicit consent, pending lock and confirmation-email instruction',async()=>{
 let resolve;requestNewsletter.mockReturnValue(new Promise(r=>{resolve=r;}));mount();
 const consent=screen.getByRole('checkbox');expect(consent).not.toBeChecked();expect(consent).toBeRequired();expect(screen.getByLabelText('Email address')).toBeRequired();
 fireEvent.change(screen.getByTestId('newsletter-input'),{target:{value:'reader@example.test'}});
 fireEvent.submit(screen.getByTestId('newsletter-form'));expect(requestNewsletter).not.toHaveBeenCalled();
 fireEvent.click(consent);fireEvent.submit(screen.getByTestId('newsletter-form'));fireEvent.submit(screen.getByTestId('newsletter-form'));
 expect(requestNewsletter).toHaveBeenCalledTimes(1);expect(requestNewsletter.mock.calls[0][0].body.consent).toBe(true);expect(screen.getByTestId('newsletter-submit')).toBeDisabled();expect(screen.queryByTestId('newsletter-success')).not.toBeInTheDocument();
 await act(async()=>resolve({status:'requested'}));expect(screen.getByTestId('newsletter-success')).toHaveTextContent('Check your email to confirm your subscription.');expect(screen.getByTestId('newsletter-success')).toHaveFocus();
});
test('keyboard input and error preserve values and consent',async()=>{
 requestNewsletter.mockRejectedValue(Error('Please retry later.'));mount();const user=userEvent.setup();
 await user.tab();expect(screen.getByTestId('newsletter-input')).toHaveFocus();await user.type(screen.getByTestId('newsletter-input'),'reader@example.test');await user.tab();await user.keyboard(' ');
 expect(screen.getByRole('checkbox')).toBeChecked();fireEvent.submit(screen.getByTestId('newsletter-form'));
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveFocus());expect(screen.getByTestId('newsletter-input')).toHaveValue('reader@example.test');expect(screen.getByRole('checkbox')).toBeChecked();
});
