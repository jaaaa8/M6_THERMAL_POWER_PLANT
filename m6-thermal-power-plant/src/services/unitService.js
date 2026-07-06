import apiClient from './apiClient';

const UNIT_URL = '/api/v1/units';

export const getAll = () => apiClient.get(UNIT_URL);

export const getById = (id) => apiClient.get(`${UNIT_URL}/${id}`);
