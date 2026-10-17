const {test,expect,db,captures,syntheticEmail}=require('./support');
test('newsletter consent, actual captured link, explicit confirmation and unsubscribe',async({page})=>{
 const email=syntheticEmail();await page.goto('/');await page.getByTestId('newsletter-input').fill(email);
 const consent=page.getByRole('checkbox',{name:/I agree to receive/});await expect(consent).not.toBeChecked();await consent.check();await page.getByTestId('newsletter-submit').click();
 await expect(page.getByTestId('newsletter-success')).toContainText('Check your email');expect(db('subscriber',email).records[0].state).toBe('pending');
 await expect.poll(()=>captures().filter(c=>c.channel==='confirmation_email'&&c.payload.to.includes(email)).length).toBe(1);
 const mail=captures().find(c=>c.channel==='confirmation_email'&&c.payload.to.includes(email));const links=mail.payload.text.match(/http:\/\/127\.0\.0\.1:4300\/newsletter\/(?:confirm|unsubscribe)#token=[^\s]+/g);expect(links).toHaveLength(2);
 await page.goto(links.find(l=>l.includes('/confirm#')));await expect(page).toHaveURL(/\/newsletter\/confirm$/);expect(db('subscriber',email).records[0].state).toBe('pending');
 await page.getByRole('button',{name:'Confirm subscription',exact:true}).click();await expect(page.getByTestId('newsletter-action-success')).toContainText('Subscription confirmed');expect(db('subscriber',email).records[0].state).toBe('subscribed');
 await expect.poll(()=>Object.values(db('subscriber',email).records[0].jobs).filter(j=>j.channel!=='confirmation_email').every(j=>j.state==='simulated')).toBe(true);
 await page.goto(links.find(l=>l.includes('/unsubscribe#')));expect(db('subscriber',email).records[0].state).toBe('subscribed');await page.getByRole('button',{name:'Unsubscribe',exact:true}).click();await expect(page.getByTestId('newsletter-action-success')).toContainText('unsubscribed');expect(db('subscriber',email).records[0].state).toBe('unsubscribed');
});
