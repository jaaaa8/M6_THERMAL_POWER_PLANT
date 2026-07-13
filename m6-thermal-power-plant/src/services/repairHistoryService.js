import apiClient from "../services/apiClient.js";

const API_URL = "/api/v1/repair-histories";

export const getAllRepairHistories = async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
};

export const createRepairHistory = async (data) => {
    const response = await apiClient.post(API_URL, data);
    return response.data;
};

export const getRepairHistoryById = async (id) => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
};