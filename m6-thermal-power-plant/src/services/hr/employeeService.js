import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/v1/employees`;


const getAuthHeader = () => {
  const token = localStorage.getItem('token') || "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzYxODAwLCJleHAiOjE3ODI3NjI3MDB9.sjxKTRyXR01jV0hGBmn08jOMBQFqp-bVHxgU78o3znk";
  return {
    Authorization: `Bearer ${token}`
  };
};

export const employeeService = {
  getAll: () => axios.get('/api/employees',{ headers: getAuthHeader()}),
  getAllWithAccounts: () => axios.get(`${API_URL}/accounts`),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  create: (data) => axios.post(API_URL, data),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data),
  remove: (id) => axios.delete(`${API_URL}/${id}`),
  
  getDepartments: () => axios.get(`${BASE_URL}/api/v1/employees/departments`),
  getExpertises: () => axios.get(`${BASE_URL}/api/v1/employees/expertises`),
  getPositions: () => axios.get(`${BASE_URL}/api/v1/employees/positions`),
};
