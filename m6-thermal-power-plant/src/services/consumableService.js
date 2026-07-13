import apiClient from './apiClient';

const CONSUMABLE_URL = '/api/v1/consumables';

export const getAll = () => apiClient.get(CONSUMABLE_URL);

export const getById = (id) => apiClient.get(`${CONSUMABLE_URL}/${id}`);

export const create = (data) => apiClient.post(CONSUMABLE_URL, data);

export const update = (id, data) => apiClient.put(`${CONSUMABLE_URL}/${id}`, data);

export const remove = (id) => apiClient.delete(`${CONSUMABLE_URL}/${id}`);
export { remove as delete };

export const search = (params) => apiClient.get(CONSUMABLE_URL, { params });

/**
 * Upload một ảnh vật tư tiêu hao lên Cloudinary, trả về { url }.
 * → POST /api/v1/consumables/images
 * @param {File} file
 */
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`${CONSUMABLE_URL}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};