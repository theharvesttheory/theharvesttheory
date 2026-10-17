import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Privacy from './Privacy';
import Footer from '../components/Footer';
import Contact from './Contact';
test('privacy explains actual intake and marks unresolved owner decisions',()=>{
 render(<MemoryRouter><Privacy /></MemoryRouter>);
 for(const label of ['Information we collect','How we use information','Service providers','Retention','Your choices and contact'])expect(screen.getByRole('heading',{name:label})).toBeInTheDocument();
 expect(screen.getByText(/Draft for owner review/)).toBeInTheDocument();expect(screen.getByText(/180 days/)).toBeInTheDocument();
});
test('footer privacy is a real route, inactive legal and social labels are not dead links',()=>{
 render(<MemoryRouter><Footer /></MemoryRouter>);
 expect(screen.getByTestId('footer-legal-privacy-policy')).toHaveAttribute('href','/privacy');
 expect(screen.getByTestId('footer-legal-terms').tagName).toBe('SPAN');expect(screen.getByTestId('footer-social-instagram').tagName).toBe('SPAN');
 expect(screen.getByTestId('footer-email').tagName).toBe('SPAN');
});
test('enquiry and newsletter privacy links resolve to the same notice',()=>{
 render(<MemoryRouter initialEntries={['/contact?type=general']}><Contact/><Footer/></MemoryRouter>);
 expect(screen.getAllByRole('link',{name:'Privacy Policy'})).toHaveLength(3);
 for(const link of screen.getAllByRole('link',{name:'Privacy Policy'}))expect(link).toHaveAttribute('href','/privacy');
});
