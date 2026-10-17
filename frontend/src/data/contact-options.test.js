import { CONTACT_TYPES } from './contact-options';
import contract from './intake-contract.json';

test('all nine existing form schemas use the shared contract', () => {
  expect(CONTACT_TYPES.map(t => t.id)).toEqual([
    'product-orders','general','retail','gifting','export',
    'collaborations','press','wholesale','sourcing',
  ]);
  expect(CONTACT_TYPES.map(t => ({id:t.id,label:t.label,fields:t.fields}))).toEqual(contract.types);
  expect(CONTACT_TYPES.find(t => t.id === 'general').fields.filter(f=>f.required).map(f=>f.id)).toEqual(['name','email','message']);
  expect(CONTACT_TYPES.every(t => t.successTitle && t.successNote)).toBe(true);
});
