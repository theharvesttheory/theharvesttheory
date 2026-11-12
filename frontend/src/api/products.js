const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const apiFetchProducts = () =>
  fetch(`${BASE}/api/products`).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch products');
    return r.json();
  });

export const apiCreateProduct = (data) =>
  fetch(`${BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => {
    if (!r.ok) return r.json().then((e) => Promise.reject(e));
    return r.json();
  });

export const apiUpdateProduct = (slug, data) =>
  fetch(`${BASE}/api/products/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => {
    if (!r.ok) return r.json().then((e) => Promise.reject(e));
    return r.json();
  });

export const apiDeleteProduct = (slug) =>
  fetch(`${BASE}/api/products/${slug}`, { method: 'DELETE' }).then((r) => {
    if (!r.ok) return r.json().then((e) => Promise.reject(e));
    return r.json();
  });

export const apiSeedProducts = () =>
  fetch(`${BASE}/api/products/seed`, { method: 'POST' }).then((r) => r.json());
