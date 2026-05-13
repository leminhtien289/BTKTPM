// API URLs được inject lúc build (VITE_* env vars)
// Dev: đặt trong .env.local — Docker: truyền qua build args
const BASE = {
  product:   import.meta.env.VITE_PU1_URL   || 'http://localhost:8081',
  cart:      import.meta.env.VITE_PU2_URL   || 'http://localhost:8082',
  order:     import.meta.env.VITE_PU3_URL   || 'http://localhost:8083',
  inventory: import.meta.env.VITE_PU4_URL   || 'http://localhost:8084',
};

export const getApiBase = () => BASE;

export const getProducts  = () => fetch(`${BASE.product}/products`).then(r => r.json());
export const getAllStock   = () => fetch(`${BASE.inventory}/stock`).then(r => r.json()).catch(() => ({}));

export const getCart = (userId) =>
  fetch(`${BASE.cart}/cart/${userId}`).then(r => r.json());

export const addToCart = (userId, { productId, name, price, quantity = 1 }) =>
  fetch(`${BASE.cart}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId, name, price, quantity }),
  }).then(r => r.json());

export const removeFromCart = (userId, productId) =>
  fetch(`${BASE.cart}/cart/${userId}/item/${productId}`, { method: 'DELETE' }).then(r => r.json());

export const checkout = async (userId) => {
  const res = await fetch(`${BASE.order}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Đặt hàng thất bại');
  return data;
};
