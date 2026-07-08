import apiClient from './apiClient';

const CONSUMABLE_URL = '/api/v1/consumables';

export const getStockList = (params) => apiClient.get(`${CONSUMABLE_URL}/stock`, { params });

export const importConsumable = (data) => apiClient.post(`${CONSUMABLE_URL}/receipts`, data);

export const getReceiptHistory = (params) => apiClient.get(`${CONSUMABLE_URL}/receipts`, { params });
