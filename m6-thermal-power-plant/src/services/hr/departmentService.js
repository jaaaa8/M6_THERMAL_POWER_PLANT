import apiClient from '../apiClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${BASE_URL}/api/v1/departments`;

export const departmentService = {
  getAll: () => apiClient.get(API_URL),
  getById: (id) => apiClient.get(`${API_URL}/${id}`),
  create: (data) => apiClient.post(API_URL, {
    departmentCode: data.maPhongBan,
    name: data.tenPhongBan,
    description: data.moTa
  }),
  update: (id, data) => apiClient.put(`${API_URL}/${id}`, {
    departmentCode: data.maPhongBan,
    name: data.tenPhongBan,
    description: data.moTa
  }),
  remove: (id) => apiClient.delete(`${API_URL}/${id}`)
};
