import axios from 'axios';

const API_URL = '/api/v1/accounts';

export const accountService = {
  getAll: () => axios.get(API_URL),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  create: (data) => axios.post(API_URL, data),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data),
  remove: (id) => axios.delete(`${API_URL}/${id}`),
  grantRole: (data) => axios.post(`${API_URL}/grant`, data),
  updateStatus: (data) => axios.patch(`${API_URL}/status`, data),
  getRoles: () => axios.get('/api/v1/roles')
};
