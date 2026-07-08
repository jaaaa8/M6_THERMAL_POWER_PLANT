import apiClient from '../apiClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${BASE_URL}/api/v1/accounts`;

export const accountService = {
  getAll: () => apiClient.get(API_URL),
  getById: (id) => apiClient.get(`${API_URL}/${id}`),
  create: (data) => apiClient.post(API_URL, data),
  update: (id, data) => apiClient.put(`${API_URL}/${id}`, data),
  remove: (id) => apiClient.delete(`${API_URL}/${id}`),
  grantRole: (data) => apiClient.post(`${API_URL}/grant`, data),
  updateStatus: (data) => apiClient.patch(`${API_URL}/status`, data),
  getRoles: () => apiClient.get(`${BASE_URL}/api/v1/roles`),
  search: (params) => apiClient.get(`${API_URL}/search`, { params }),
  resetPassword: (id) => apiClient.post(`${API_URL}/${id}/reset-password`)
};
