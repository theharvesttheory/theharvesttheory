const fs=require('fs');const path=require('path');
const {test,expect}=require('./support');
const slugs=file=>[...fs.readFileSync(path.join(__dirname,'../src/data',file),'utf8').matchAll(/slug:\s*"([^"]+)"/g)].map(match=>match[1]);
const original=['/','/products','/collections','/journal','/approach','/story','/contact',...slugs('products.js').map(s=>`/products/${s}`),...slugs('collections.js').map(s=>`/collections/${s}`),...slugs('journal.js').map(s=>`/journal/${s}`)];
if(original.length!==28)throw Error('Update the explicit original content inventory');
for(const route of [...original,'/privacy','/newsletter/confirm','/newsletter/unsubscribe']){
 test(`content deep link and reload ${route}`,async({page,baseURL})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.url().startsWith(baseURL)&&r.status()>=400)errors.push(`Local resource ${r.status()} ${new URL(r.url()).pathname}`);});
  await page.goto(route);await expect(page.getByRole('heading',{level:1})).toBeVisible();await expect(page.getByTestId('site-footer')).toBeAttached();
  await page.reload();await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await page.locator('img').evaluateAll(images=>images.forEach(image=>{image.loading='eager';}));
  await expect.poll(()=>page.locator('img').evaluateAll(images=>images.filter(image=>!image.complete||image.naturalWidth===0).map(image=>image.getAttribute('src')))).toEqual([]);
  expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 });
}
test('product filters and product/assortment enquiry prefills',async({page})=>{
 await page.goto('/products');await expect(page.getByTestId('products-grid').locator('[data-testid^="product-card-"]')).toHaveCount(13);
 await page.getByTestId('filter-cat-matcha').click();await expect(page.getByTestId('products-grid').locator('[data-testid^="product-card-"]')).toHaveCount(1);
 await page.getByTestId('product-card-coco-matcha').click();await page.getByTestId('product-enquire-link').click();await expect(page.getByTestId('contact-field-products')).toHaveValue('Coco Matcha');
 await page.goto('/collections/sacred-spring');await page.getByTestId('collection-enquire-link').click();await expect(page.getByTestId('contact-field-products')).toHaveValue(/Sacred Spring/);
});
test('journal navigation and keyboard newsletter consent',async({page})=>{
 await page.goto('/journal');await page.getByTestId('journal-featured').click();await expect(page.getByTestId('journal-article')).toBeVisible();
 const email=page.getByTestId('newsletter-input');await email.focus();await page.keyboard.type('keyboard@example.test');await page.keyboard.press('Tab');await expect(page.getByRole('checkbox',{name:/I agree to receive/})).toBeFocused();await page.keyboard.press('Space');await expect(page.getByRole('checkbox',{name:/I agree to receive/})).toBeChecked();
});
