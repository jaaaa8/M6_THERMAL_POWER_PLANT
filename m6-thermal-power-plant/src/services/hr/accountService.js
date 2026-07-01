import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const token =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzQxOTIzLCJleHAiOjE3ODI3NDI4MjN9.6xvDahsU0j6lgP36liCej8JMXa8OIrxBvGBvEND8dk8";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const accountService = {
  getAll: () => api.get("/api/v1/accounts"),

  getById: (id) => api.get(`/api/v1/accounts/${id}`),

  create: (data) => api.post("/api/v1/accounts", data),

  update: (id, data) => api.put(`/api/v1/accounts/${id}`, data),

  remove: (id) => api.delete(`/api/v1/accounts/${id}`),

  grantRole: (data) => api.post("/api/v1/accounts/grant", data),

  updateStatus: (data) => api.patch("/api/v1/accounts/status", data),

  getRoles: () => api.get("/api/v1/roles"),
};