import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzQxOTIzLCJleHAiOjE3ODI3NDI4MjN9.6xvDahsU0j6lgP36liCej8JMXa8OIrxBvGBvEND8dk8";

const authConfig = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const API_URL = `${BASE_URL}/api/v1/employees/departments`;

export const departmentService = {
  getAll: () => axios.get(API_URL, authConfig),

  remove: (id) => axios.delete(`${API_URL}/${id}`, authConfig),
};