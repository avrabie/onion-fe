export const API_BASE = import.meta.env.VITE_API_BASE || '';

export function buildUrl(path) {
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
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      msg = data?.message || JSON.stringify(data);
    } catch (_) {}
    throw new Error(msg);
  }
  // some endpoints may return 204 or empty; parse according to Content-Type
  const text = await res.text();
  if (!text) return null;
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      // Handle double-encoded JSON strings (e.g., "[{...}]")
      if (typeof parsed === 'string') {
        const s = parsed.trim();
        if (s.startsWith('{') || s.startsWith('[')) {
          try { return JSON.parse(s); } catch (_) { return parsed; }
        }
      }
      return parsed;
    } catch (e) {
      // fallback to raw text if parsing fails
      return text;
    }
  }
  return text;
}

function randomPassword(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
  let out = ''
  const random = typeof crypto !== 'undefined' && crypto.getRandomValues ?
    (n) => crypto.getRandomValues(new Uint32Array(n)) :
    (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 0xffffffff))
  const buf = random(len)
  for (let i = 0; i < len; i++) {
    out += chars[buf[i] % chars.length]
  }
  return out
}

export function saveAppUserId(id) {
  try {
    if (id == null) {
      localStorage.removeItem('onion.appUserId');
    } else {
      localStorage.setItem('onion.appUserId', String(id));
    }
  } catch (_) {}
  // Notify same-tab listeners
  try {
    const evt = new Event('appUserIdChanged');
    window.dispatchEvent(evt);
  } catch (_) {}
}

export const api = {
  // Auth helpers (URLs)
  getOAuthUrl(provider) {
    return buildUrl(`/oauth2/authorization/${provider}`);
  },
  getLoginUrl() {
    return buildUrl('/login');
  },
  getLogoutUrl() {
    return buildUrl('/logout');
  },
  async getCurrentUser() {
    // OAuth/OIDC info (current provider) for the current authenticated session
    try {
      const res = await fetch(buildUrl('/users/me'), { credentials: 'include' });
      if (res.status === 401 || res.status === 403) return null;
      if (!res.ok) return null;
      const text = await res.text();
      if (!text) return {};
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(text);
          if (typeof parsed === 'string') {
            const s = parsed.trim();
            if (s.startsWith('{') || s.startsWith('[')) {
              try { return JSON.parse(s); } catch (_) { return {}; }
            }
          }
          return parsed || {};
        } catch (_) { return {}; }
      }
      // If not JSON, return empty object to avoid crashing callers
      return {};
    } catch (_) {
      return null;
    }
  },
  async getAuthProvider() {
    // Returns { provider: string } or null if unauthenticated
    try {
      const res = await fetch(buildUrl('/users/me/provider'), { credentials: 'include' });
      if (res.status === 401 || res.status === 403) return null;
      if (!res.ok) return null;
      const text = await res.text();
      if (!text) return null;
      try {
        const data = JSON.parse(text);
        return data;
      } catch (_) {
        return { provider: String(text).trim() };
      }
    } catch (_) {
      return null;
    }
  },
  async ensureAppUserFromMe() {
    // Ensure application user exists using the current principal (e.g., Google login)
    return request('/users/ensure-from-me', { method: 'POST' });
  },
  async createUser({ username, email, password, pictureUrl }) {
    // Create a new application user; backend may ignore unknown/empty fields
    return request('/users', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, pictureUrl }),
    });
  },
  async createUserFromOAuth() {
    // Create user using info from /users/me (OAuth user info for any provider). Generates a strong random password.
    const me = await this.getCurrentUser();
    if (!me || !me.email) {
      throw new Error('OAuth session not available or no email in profile');
    }
    const email = me.email;
    let username = me.name && me.name.trim() ? me.name.trim() : (email.split('@')[0] || 'user');
    // Normalize username to a simple slug-like string
    username = username.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || (email.split('@')[0] || 'user');
    const pictureUrl = me.picture || undefined;
    const password = randomPassword(24);
    return this.createUser({ username, email, password, pictureUrl });
  },
  async createUserFromGoogle() {
    // Backward-compatible alias to the generic OAuth creator
    return this.createUserFromOAuth();
  },

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

  // Orders
  async getOrdersByUser(userId) {
    return request(`/orders/user/${userId}`, { method: 'GET' });
  },
  async getOrderItems(orderId) {
    return request(`/orders/${encodeURIComponent(orderId)}/items`, { method: 'GET' });
  },
};
