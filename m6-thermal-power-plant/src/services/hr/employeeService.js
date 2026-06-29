import axios from 'axios';

const API_URL = '/api/employees';

export const employeeService = {
  getAll: () => axios.get(API_URL),
  getAllWithAccounts: () => axios.get(`${API_URL}/accounts`),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  create: (data) => axios.post(API_URL, data),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data),
  remove: (id) => axios.delete(`${API_URL}/${id}`),
  
  getDepartments: () => axios.get(`${API_URL}/departments`),
  getExpertises: () => axios.get(`${API_URL}/expertises`),
  getPositions: () => axios.get(`${API_URL}/positions`),
};
