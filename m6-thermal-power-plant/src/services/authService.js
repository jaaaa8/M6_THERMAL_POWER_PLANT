import apiClient, { TOKEN_KEYS, tokenStore } from './apiClient';

const AUTH_URL = '/api/v1/auth';
const ACCOUNT_URL = '/api/v1/accounts';

/**
 * Bridge giai đoạn chuyển đổi: BE hiện trả role VN, FE đã dùng EN.
 * Sau khi BE cập nhật seed sang EN (xem docs/ROLE_CODES.md), xoá map này.
 */
const LEGACY_ROLE_MAP = {
  TRUONG_CA: 'SHIFT_LEADER',
  // Các role cũ khác (NHAN_VIEN, KY_THUAT_VIEN, GIAM_SAT, TRUONG_PHONG, GIAM_DOC)
  // không còn tồn tại trong bộ 9 role mới — xem docs/ROLE_CODES.md.
  // 'ADMIN' giữ nguyên.
};

function normalizeRoles(roles = []) {
  return roles.map((r) => LEGACY_ROLE_MAP[r] || r);
}

/**
 * Chuẩn hoá user từ BE.
 */
function normalizeUser(beUser) {
  if (!beUser) return null;
  const roles = normalizeRoles(beUser.roles || []);
  return {
    accountId: beUser.accountId,
    username: beUser.username,
    fullName: beUser.fullName || beUser.username,
    roles,
    role: roles[0] || null, // tiện cho check role chính
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
};
