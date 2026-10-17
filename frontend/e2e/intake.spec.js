const {test,expect,db,captures,syntheticEmail}=require('./support');
const contract=require('../src/data/intake-contract.json');
async function fill(page,schema,email){
 await page.goto(`/contact?type=${schema.id}`);
 for(const field of schema.fields)await page.getByTestId(`contact-field-${field.id}`).fill(field.id==='email'?email:`Synthetic ${field.id}`);
}
for(const schema of contract.types){
 test(`${schema.id}: browser receipt matches persisted fields and both simulated jobs`,async({page})=>{
  const email=syntheticEmail();await fill(page,schema,email);
  const received=page.waitForResponse(r=>r.url().endsWith('/api/enquiries')&&r.request().method()==='POST');
  await page.getByTestId('contact-submit').click();const response=await received;expect(response.status()).toBe(201);const receipt=await response.json();
  await expect(page.getByTestId('contact-success')).toContainText(receipt.id);
  const saved=db('enquiry',email);expect(saved.count).toBe(1);expect(saved.records[0]._id).toBe(receipt.id);expect(saved.records[0].type).toBe(schema.id);
  for(const field of schema.fields)expect(saved.records[0].fields[field.id]).toBe(field.id==='email'?email:`Synthetic ${field.id}`);
  await expect.poll(()=>Object.values(db('enquiry',email).records[0].jobs).every(job=>job.state==='simulated')).toBe(true);
  const ids=Object.values(saved.records[0].jobs).map(j=>j.job_id);expect(captures().filter(c=>ids.includes(c.job_id))).toHaveLength(2);
 });
}
test('lost browser response retries same key and keeps exactly one record',async({page})=>{
 const email=syntheticEmail();const keys=[];let drop=true;
 await page.route('**/api/enquiries',async route=>{if(route.request().method()!=='POST')return route.continue();keys.push(route.request().headers()['idempotency-key']);const response=await route.fetch();if(drop){drop=false;await route.abort('failed');}else await route.fulfill({response});});
 await fill(page,contract.types.find(t=>t.id==='general'),email);await page.getByTestId('contact-submit').click();
 await expect(page.getByRole('alert')).toContainText('Connection interrupted');expect(db('enquiry',email).count).toBe(1);await expect(page.getByTestId('contact-field-email')).toHaveValue(email);
 await page.getByTestId('contact-submit').click();await expect(page.getByTestId('contact-success')).toBeVisible();expect(keys).toHaveLength(2);expect(keys[0]).toBe(keys[1]);expect(db('enquiry',email).count).toBe(1);
});
test('real 422, shared rate limit 429, and persistence failure 503 preserve form',async({page})=>{
 const email=syntheticEmail();await fill(page,contract.types.find(t=>t.id==='general'),email);await page.getByTestId('contact-field-name').fill('   ');
 let response=page.waitForResponse(r=>r.url().endsWith('/api/enquiries')&&r.request().method()==='POST');await page.getByTestId('contact-submit').click();expect((await response).status()).toBe(422);await expect(page.getByTestId('contact-field-name')).toHaveAttribute('aria-invalid','true');expect(db('enquiry',email).count).toBe(0);
 await page.getByTestId('contact-field-name').fill('Synthetic name');db('rate-block');
 try{response=page.waitForResponse(r=>r.url().endsWith('/api/enquiries')&&r.request().method()==='POST');await page.getByTestId('contact-submit').click();expect((await response).status()).toBe(429);await expect(page.getByRole('alert')).toContainText('Too many attempts');}finally{db('rate-reset');}
 db('fault','before');
 try{response=page.waitForResponse(r=>r.url().endsWith('/api/enquiries')&&r.request().method()==='POST');await page.getByTestId('contact-submit').click();expect((await response).status()).toBe(503);await expect(page.getByRole('alert')).toContainText('could not confirm');expect(db('enquiry',email).count).toBe(0);}finally{db('fault','clear');}
 await page.getByTestId('contact-submit').click();await expect(page.getByTestId('contact-success')).toBeVisible();expect(db('enquiry',email).count).toBe(1);
});
test('rapid submissions create one request and one receipt',async({page})=>{
 const email=syntheticEmail();await fill(page,contract.types.find(t=>t.id==='general'),email);let count=0;page.on('request',r=>{if(r.url().endsWith('/api/enquiries')&&r.method()==='POST')count++;});
 await page.getByTestId('contact-form').evaluate(form=>{form.requestSubmit();form.requestSubmit();});
 await expect(page.getByTestId('contact-success')).toBeVisible();expect(count).toBe(1);expect(db('enquiry',email).count).toBe(1);
});
