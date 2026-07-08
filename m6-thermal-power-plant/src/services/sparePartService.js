import apiClient from './apiClient';

const SPARE_PART_URL = '/api/v1/spare-parts';

export const getAll = () => apiClient.get(SPARE_PART_URL);

export const getById = (id) => apiClient.get(`${SPARE_PART_URL}/${id}`);

export const create = (data) => apiClient.post(SPARE_PART_URL, data);

export const update = (id, data) => apiClient.put(`${SPARE_PART_URL}/${id}`, data);

export const remove = (id) => apiClient.delete(`${SPARE_PART_URL}/${id}`);
export { remove as delete };

export const search = (params) => apiClient.get(SPARE_PART_URL, { params });