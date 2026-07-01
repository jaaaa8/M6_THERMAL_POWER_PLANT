import apiClient from '../apiClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${BASE_URL}/api/v1/employees/departments`;

export const departmentService = {
  getAll: () => apiClient.get(API_URL),
  remove: (id) => apiClient.delete(`${API_URL}/${id}`)
};
