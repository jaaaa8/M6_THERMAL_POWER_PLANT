import apiClient from "../apiClient";

const URL = "/api/v1/catalog";

export const getAll = (page = 0, size = 5) =>
    apiClient.get(URL, {
        params: {
            page,
            size
        }
    });

/**
 * Lấy chi tiết 1 catalog
 */
export const getById = (id) =>
    apiClient.get(`${URL}/${id}`);

/**
 * Thêm mới catalog
 */
export const create = (data) =>
    apiClient.post(URL, data);

/**
 * Cập nhật catalog
 */
export const update = (id, data) =>
    apiClient.put(`${URL}/${id}`, data);

/**
 * Xóa catalog
 */
export const remove = (id) =>
    apiClient.delete(`${URL}/${id}`);