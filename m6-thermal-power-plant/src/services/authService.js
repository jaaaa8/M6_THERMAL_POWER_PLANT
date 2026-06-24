import axios from 'axios';

const API_URL = '/api/auth';

/**
 * Mock users — sẽ thay bằng API thực khi có Backend
 */
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'ADMIN',
    hoTen: 'Nguyễn Văn Admin',
    email: 'admin@scms.vn',
  },
  {
    id: 2,
    username: 'truongca',
    password: 'truongca123',
    role: 'TRUONG_CA',
    hoTen: 'Trần Minh Trưởng Ca',
    email: 'truongca@scms.vn',
  },
];

const STORAGE_KEY = 'scms_current_user';

export const authService = {
  /**
   * Đăng nhập — Mock: so sánh username/password với MOCK_USERS
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{data: object}>} User object (không chứa password)
   */
  login: (username, password) => {
    // TODO: Thay bằng axios.post(API_URL + '/login', { username, password })
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_USERS.find(
          (u) => u.username === username && u.password === password
        );
        if (user) {
          const { password: _, ...safeUser } = user;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
          resolve({ data: safeUser });
        } else {
          reject({
            response: {
              status: 401,
              data: { message: 'Tên đăng nhập hoặc mật khẩu không đúng' },
            },
          });
        }
      }, 800);
    });
  },

  /**
   * Đăng xuất — xoá user khỏi localStorage
   */
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    // TODO: axios.post(API_URL + '/logout')
  },

  /**
   * Lấy user đang đăng nhập (từ localStorage)
   * @returns {object|null}
   */
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Kiểm tra đã đăng nhập chưa
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return authService.getCurrentUser() !== null;
  },
};
