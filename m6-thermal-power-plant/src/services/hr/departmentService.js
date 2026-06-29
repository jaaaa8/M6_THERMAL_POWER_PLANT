import axios from 'axios';

const API_URL = '/api/v1/employees/departments';

export const departmentService = {
  getAll: () => axios.get(API_URL),
  remove: (id) => axios.delete(`${API_URL}/${id}`)
};
