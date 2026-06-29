import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${BASE_URL}/api/v1/employees/departments`;

export const departmentService = {
  getAll: () => axios.get(API_URL),
  remove: (id) => axios.delete(`${API_URL}/${id}`)
};
