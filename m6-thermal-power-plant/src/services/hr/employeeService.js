import axios from 'axios';

const API_URL = '/api/v1/employees';

export const employeeService = {
  getAll: () => axios.get(API_URL),
  getAllWithAccounts: () => axios.get(`${API_URL}/accounts`),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  create: (data) => axios.post(API_URL, data),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data),
  remove: (id) => axios.delete(`${API_URL}/${id}`),
  
  getDepartments: () => axios.get('/api/v1/employees/departments'),
  getExpertises: () => axios.get('/api/v1/employees/expertises'),
  getPositions: () => axios.get('/api/v1/employees/positions'),
};
