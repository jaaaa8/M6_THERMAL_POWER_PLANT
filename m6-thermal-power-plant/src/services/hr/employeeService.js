import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";
const API_URL = `${BASE_URL}/api/v1/employees`;

const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzQxOTIzLCJleHAiOjE3ODI3NDI4MjN9.6xvDahsU0j6lgP36liCej8JMXa8OIrxBvGBvEND8dk8";


const authConfig = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

export const employeeService = {
  getAll: () => axios.get(API_URL, authConfig),

  getAllWithAccounts: () =>
      axios.get(`${API_URL}/accounts`, authConfig),

  getById: (id) =>
      axios.get(`${API_URL}/${id}`, authConfig),

  create: (data) =>
      axios.post(API_URL, data, authConfig),

  update: (id, data) =>
      axios.put(`${API_URL}/${id}`, data, authConfig),

  remove: (id) =>
      axios.delete(`${API_URL}/${id}`, authConfig),

  getDepartments: () =>
      axios.get(`${API_URL}/departments`, authConfig),

  getExpertises: () =>
      axios.get(`${API_URL}/expertises`, authConfig),

  getPositions: () =>
      axios.get(`${API_URL}/positions`, authConfig),
};