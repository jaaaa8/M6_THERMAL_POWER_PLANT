import apiClient from "../apiClient";
const UNIT_URL = "/api/v1/units";


export const getAll = (
    page = 0,
    size = 5
) =>
    apiClient.get(UNIT_URL, {
        params: {
            page,
            size,
        },
    });

export const createUnit = (data) =>
    apiClient.post(UNIT_URL, data);

export const deleteUnit = (id) =>
    apiClient.delete(`${UNIT_URL}/${id}`);

export const updateUnit = (id, data) =>
    apiClient.put(`${UNIT_URL}/${id}`, data);