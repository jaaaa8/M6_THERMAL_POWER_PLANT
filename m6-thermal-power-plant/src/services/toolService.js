import apiClient from './apiClient';
const axios = apiClient;

const TOOL_URL = '/api/v1/tools';
const CATEGORY_URL = '/api/v1/tool-categories';
const BORROW_URL = '/api/v1/tool-borrow-logs';

export const toolCategoryService = {
  getAll: () => axios.get(CATEGORY_URL),
  create: (payload) => axios.post(CATEGORY_URL, payload),
  update: (id, payload) => axios.put(`${CATEGORY_URL}/${id}`, payload),
  remove: (id) => axios.delete(`${CATEGORY_URL}/${id}`),
  getNextCode: () => axios.get(`${CATEGORY_URL}/next-code`),

  /**
   * Tìm kiếm chủng loại theo tên và/hoặc mã.
   * @param {{ categoryName?: string, categoryCode?: string }} params
   */
  search: (params = {}) => axios.get(`${CATEGORY_URL}/search`, { params }),
};

export const toolService = {
  getTransactionLogs: (id) => axios.get(`${TOOL_URL}/${id}/logs`),

  /**
   * Tìm kiếm CCDC theo tên/mã + chủng loại.
   * @param {{ keyword?: string, categoryId?: number, page?: number, size?: number }} params
   */
  search: (params = {}) => axios.get(TOOL_URL, { params: { size: 1000, ...params } }),

  getById: (id) => axios.get(`${TOOL_URL}/${id}`),

  getNextCode: () => axios.get(`${TOOL_URL}/next-code`),

  create: (payload) => axios.post(TOOL_URL, payload),

  update: (id, payload) => axios.put(`${TOOL_URL}/${id}`, payload),

  remove: (id) => axios.delete(`${TOOL_URL}/${id}`),

  /** Nhập thêm số lượng vào kho */
  addQuantity: (id, payload) => axios.patch(`${TOOL_URL}/${id}/quantity`, payload),

  /** Huỷ số lượng CCDC bị hư hỏng */
  markDamaged: (id, payload) => axios.patch(`${TOOL_URL}/${id}/damage`, payload),

  /** Tải file Excel mẫu (blob) */
  downloadImportTemplate: () =>
      axios.get(`${TOOL_URL}/import/template`, { responseType: 'blob' }),

  /** Upload file để xem trước dữ liệu import (chưa lưu) */
  previewImport: (file) => {
    const form = new FormData();
    form.append('file', file);
    return axios.post(`${TOOL_URL}/import/preview`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Xác nhận import — lưu tất cả (all-or-nothing) */
  confirmImport: (file) => {
    const form = new FormData();
    form.append('file', file);
    return axios.post(`${TOOL_URL}/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const toolBorrowLogService = {
  search: (params = {}) => axios.get(BORROW_URL, { params: { size: 1000, ...params } }),

  getById: (id) => axios.get(`${BORROW_URL}/${id}`),

  createBorrowRequest: (accountId, payload) =>
      axios.post(BORROW_URL, payload, { params: { accountId } }),

  approve: (id, approvedByAccountId) =>
      axios.patch(`${BORROW_URL}/${id}/approve`, null, { params: { approvedByAccountId } }),

  reject: (id, approvedByAccountId, payload) =>
      axios.patch(`${BORROW_URL}/${id}/reject`, payload, { params: { approvedByAccountId } }),

  returnTool: (id, payload) => axios.patch(`${BORROW_URL}/${id}/return`, payload),
};