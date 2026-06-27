import axios from 'axios';

// Để trống → request đi qua Vite dev proxy (`/api → backend`). Cấu hình ở vite.config.js.
// Khi build production, set VITE_API_BASE_URL để trỏ thẳng tới backend.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const TOKEN_KEYS = {
  access: 'scms_access_token',
  refresh: 'scms_refresh_token',
  user: 'scms_current_user',
};

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEYS.access),
  getRefresh: () => localStorage.getItem(TOKEN_KEYS.refresh),
  setTokens: (access, refresh) => {
    if (access) localStorage.setItem(TOKEN_KEYS.access, access);
    if (refresh) localStorage.setItem(TOKEN_KEYS.refresh, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
    localStorage.removeItem(TOKEN_KEYS.user);
  },
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

async function performRefresh() {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

  const res = await axios.post(
    '/api/v1/auth/refresh',
    { refreshToken },
    { baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } }
  );
  const data = res.data?.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('INVALID_REFRESH_RESPONSE');
  }
  tokenStore.setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err.response?.status;
    const url = original?.url || '';

    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || performRefresh();
        const newAccess = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch (refreshErr) {
        refreshPromise = null;
        tokenStore.clear();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default apiClient;
