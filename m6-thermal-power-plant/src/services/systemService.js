import apiClient from "./apiClient";

const SYSTEM_URL = "/api/v1/systems";

export const getAll = (params) =>
  apiClient.get(SYSTEM_URL, { params });

export const getById = (id) =>
  apiClient.get(`${SYSTEM_URL}/${id}`);

export const create = (data) =>
  apiClient.post(SYSTEM_URL, data);

export const update = (id, data) =>
  apiClient.put(`${SYSTEM_URL}/${id}`, data);

export const remove = (id) =>
  apiClient.delete(`${SYSTEM_URL}/${id}`);

export { remove as delete };

// Tìm kiếm (nếu cần đặt tên riêng)
export const search = (params) =>
  apiClient.get(SYSTEM_URL, { params });