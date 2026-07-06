import apiClient from './apiClient';

const SPARE_PART_URL = '/api/v1/spare-parts';

export const getStockList = (params) => apiClient.get(`${SPARE_PART_URL}/stock`, { params });

export const importSparePart = (data) => apiClient.post(`${SPARE_PART_URL}/receipts`, data);

export const getReceiptHistory = (params) => apiClient.get(`${SPARE_PART_URL}/receipts`, { params });
