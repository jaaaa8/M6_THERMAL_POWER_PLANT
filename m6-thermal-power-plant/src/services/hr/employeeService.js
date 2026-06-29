import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/v1/employees`;

export const employeeService = {
  getAll: () => axios.get('/api/employees'),
  getAllWithAccounts: () => axios.get(`${API_URL}/accounts`),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  create: (data) => axios.post(API_URL, data),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data),
  remove: (id) => axios.delete(`${API_URL}/${id}`),
  
  getDepartments: () => axios.get(`${BASE_URL}/api/v1/employees/departments`),
  getExpertises: () => axios.get(`${BASE_URL}/api/v1/employees/expertises`),
  getPositions: () => axios.get(`${BASE_URL}/api/v1/employees/positions`),
};
