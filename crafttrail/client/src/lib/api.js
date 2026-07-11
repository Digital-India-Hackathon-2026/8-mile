const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'crafttrail_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const qs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${k}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : v)}`)
    .join('&');

const api = {
  // discovery — public
  discover: ({ lat, lng, radiusKm = 150, crafts = [], sort = 'relevance', state = null }) =>
    request(`/discover?${qs({ lat, lng, radiusKm, crafts, sort, state })}`),
  artisan: (id) => request(`/discover/artisans/${id}`),
  audit: (id) => request(`/artisans/${id}/audit`),
  crafts: () => request('/crafts'),
  states: () => request('/states'),

  // auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  updateMe: (body) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/me/password', { method: 'POST', body: JSON.stringify(body) }),
  deleteAccount: () => request('/auth/me', { method: 'DELETE' }),
  myBookings: () => request('/auth/me/bookings'),

  // booking — acting requires an account
  book: (body) => request('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  booking: (id) => request(`/bookings/${id}`),
  confirm: (id, via) => request(`/bookings/${id}/confirm`, { method: 'POST', body: JSON.stringify({ via }) }),
  complete: (id, qrToken) => request(`/bookings/${id}/complete`, { method: 'POST', body: JSON.stringify({ qrToken }) }),

  whatsapp: (from, body) => request('/whatsapp/webhook', { method: 'POST', body: JSON.stringify({ from, body }) }),

  // certificates — public forever
  certificate: (code) => request(`/certificates/${code}`),
  verifyCertificate: (code) => request(`/certificates/${code}/verify`),

  admin: {
    stats: () => request('/admin/stats'),
    artisans: (params) => request(`/admin/artisans?${qs(params)}`),
    create: (body) => request('/admin/artisans', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => request(`/admin/artisans/${id}`, { method: 'DELETE' }),
    audit: () => request('/admin/audit'),
    clusters: () => request('/clusters'),
  },

  // generic helpers for new endpoints
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: 'POST',   body: body ? JSON.stringify(body) : undefined }),
  delete: (path)       => request(path, { method: 'DELETE' }),
  patch:  (path, body) => request(path, { method: 'PATCH',  body: body ? JSON.stringify(body) : undefined }),
};

// Also make api callable as a function (e.g. api('/me/saved'))
const _api = Object.assign((path) => request(path), api);
export { _api as api };