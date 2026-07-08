import apiClient from '../apiClient.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${BASE_URL}/api/v1/employees`;

export const employeeService = {
  getAll: () => apiClient.get(API_URL),
  getAllWithAccounts: () => apiClient.get(`${API_URL}/accounts`),
  getById: (id) => apiClient.get(`${API_URL}/${id}`),
  create: (data) => apiClient.post(API_URL, data),
  update: (id, data) => apiClient.put(`${API_URL}/${id}`, data),
  remove: (id) => apiClient.delete(`${API_URL}/${id}`),
  search: (params = {}) => apiClient.get(`${API_URL}/search`, { params }),
  
  getDepartments: () => apiClient.get(`${BASE_URL}/api/v1/employees/departments`),
  getExpertises: () => apiClient.get(`${BASE_URL}/api/v1/employees/expertises`),
  getPositions: () => apiClient.get(`${BASE_URL}/api/v1/employees/positions`),
};
