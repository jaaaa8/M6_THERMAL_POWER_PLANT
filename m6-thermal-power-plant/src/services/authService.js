import apiClient, { TOKEN_KEYS, tokenStore } from './apiClient';

const AUTH_URL = '/api/v1/auth';
const ACCOUNT_URL = '/api/v1/accounts';

/**
 * Chuẩn hoá user từ BE.
 * (BE đã seed role theo mã EN — xem docs/ROLE_CODES.md — nên không cần map chuyển đổi nữa.)
 */
function normalizeUser(beUser) {
  if (!beUser) return null;
  const roles = beUser.roles || [];
  return {
    accountId: beUser.accountId,
    username: beUser.username,
    fullName: beUser.fullName || beUser.username,
    roles,
    role: roles[0] || null, // tiện cho check role chính
    // Permission code thật từ BE — nguồn dữ liệu cho canAccess/hasPermission (roleService)
    permissions: beUser.permissions || [],
    employeeCode: beUser.employeeCode,
    departmentName: beUser.departmentName,
    position: beUser.position,
    avatarUrl: beUser.avatarUrl,
  };
}

function persistUser(user) {
  localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(user));
}

export const authService = {
  login: async (username, password) => {
    const res = await apiClient.post(`${AUTH_URL}/login`, { username, password });
    const payload = res.data?.data;
    if (!payload?.accessToken) {
      throw new Error('Login response không hợp lệ');
    }
    tokenStore.setTokens(payload.accessToken, payload.refreshToken);
    const user = normalizeUser(payload.user);
    persistUser(user);
    return { data: user };
  },

  logout: async () => {
    try {
      if (tokenStore.getAccess()) {
        await apiClient.post(`${AUTH_URL}/logout`);
      }
    } catch {
      // ignore — vẫn clear local
    } finally {
      tokenStore.clear();
    }
  },

  fetchMe: async () => {
    const res = await apiClient.get(`${AUTH_URL}/me`);
    const user = normalizeUser(res.data?.data);
    if (user) persistUser(user);
    return user;
  },

  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(TOKEN_KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => !!tokenStore.getAccess(),

  createAccount: async ({ username, password, roleNames }) => {
    const res = await apiClient.post(`${ACCOUNT_URL}/create`, {
      username,
      password,
      roleNames,
    });
    return res.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    return apiClient.post(`${AUTH_URL}/change-password`, { oldPassword, newPassword });
  },
};
