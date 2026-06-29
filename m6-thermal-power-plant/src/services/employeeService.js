import apiClient from './apiClient';

const API_URL = '/api/employees';

export const employeeService = {
  /**
   * Lấy danh sách tất cả nhân sự
   */
  getAll: () => apiClient.get(API_URL),

  /**
   * Lấy nhân sự theo ID
   */
  getById: (id) => apiClient.get(`${API_URL}/${id}`),

  /**
   * Thêm mới nhân sự (có avatar → dùng FormData multipart)
   * @param {FormData} formData - Dữ liệu nhân sự dạng multipart/form-data
   */
  create: (formData) =>
    apiClient.post(API_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Cập nhật nhân sự
   * @param {number} id
   * @param {FormData} formData
   */
  update: (id, formData) =>
    apiClient.put(`${API_URL}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Xoá nhân sự
   */
  remove: (id) => apiClient.delete(`${API_URL}/${id}`),

  /**
   * Lấy danh sách phòng ban (dropdown)
   */
  getDepartmentList: () => apiClient.get('/api/departments'),
};
