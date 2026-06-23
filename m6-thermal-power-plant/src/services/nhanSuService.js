import axios from 'axios';

const API_URL = '/api/nhan-su';

export const nhanSuService = {
  /**
   * Lấy danh sách tất cả nhân sự
   */
  getAll: () => axios.get(API_URL),

  /**
   * Lấy nhân sự theo ID
   */
  getById: (id) => axios.get(`${API_URL}/${id}`),

  /**
   * Thêm mới nhân sự (có avatar → dùng FormData multipart)
   * @param {FormData} formData - Dữ liệu nhân sự dạng multipart/form-data
   */
  create: (formData) =>
    axios.post(API_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Cập nhật nhân sự
   * @param {number} id
   * @param {FormData} formData
   */
  update: (id, formData) =>
    axios.put(`${API_URL}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Xoá nhân sự
   */
  remove: (id) => axios.delete(`${API_URL}/${id}`),

  /**
   * Lấy danh sách phòng ban (dropdown)
   */
  getPhongBanList: () => axios.get('/api/phong-ban'),
};
