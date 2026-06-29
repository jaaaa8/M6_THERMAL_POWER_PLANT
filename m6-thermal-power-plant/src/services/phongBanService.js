import apiClient from './apiClient';

const API_URL = '/api/phong-ban';

export const phongBanService = {
  getAll: () => apiClient.get(API_URL),
  getById: (id) => apiClient.get(`${API_URL}/${id}`),
  create: (data) => apiClient.post(API_URL, data),
  update: (id, data) => apiClient.put(`${API_URL}/${id}`, data),
  remove: (id) => apiClient.delete(`${API_URL}/${id}`)
};
