const API_BASE = import.meta.env.VITE_API_BASE || '';

function buildUrl(path) {
  // If API_BASE is provided, ensure no double slash
  if (API_BASE) {
    return API_BASE.replace(/\/$/, '') + path;
  }
  return path; // relative to current origin (use Vite proxy or enable CORS on backend)
}

async function request(path, options = {}) {
  const res = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      msg = data.message || JSON.stringify(data);
    } catch (_) {}
    throw new Error(msg);
  }
  // some endpoints may return 204 or empty
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Products
  async getProducts() {
    return request('/products', { method: 'GET' });
  },
  async getProductBySlug(slug) {
    return request(`/products/name/${encodeURIComponent(slug)}`, { method: 'GET' });
  },

  // Cart for a user
  async getCart(userId) {
    return request(`/users/${userId}/cart`, { method: 'GET' });
  },
  async emptyCart(userId) {
    return request(`/users/${userId}/cart`, { method: 'DELETE' });
  },
  async addToCart(userId, { productId, quantity }) {
    return request(`/users/${userId}/cart/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },
  async removeFromCart(userId, { productId }) {
    return request(`/users/${userId}/cart/items`, {
      method: 'DELETE',
      body: JSON.stringify({ productId }),
    });
  },
  async checkout(userId) {
    return request(`/users/${userId}/cart/checkout`, { method: 'POST' });
  },

  // Payments
  async createCheckout({ orderId, successUrl, cancelUrl }) {
    return request(`/api/payments/create-checkout`, {
      method: 'POST',
      body: JSON.stringify({ orderId, successUrl, cancelUrl }),
    });
  },
};
