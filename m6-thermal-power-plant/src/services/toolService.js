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

  create: (payload) => axios.post(TOOL_URL, payload),

  update: (id, payload) => axios.put(`${TOOL_URL}/${id}`, payload),

  remove: (id) => axios.delete(`${TOOL_URL}/${id}`),

  /** Nhập thêm số lượng vào kho */
  addQuantity: (id, payload) => axios.patch(`${TOOL_URL}/${id}/quantity`, payload),

  /** Huỷ số lượng CCDC bị hư hỏng */
  markDamaged: (id, payload) => axios.patch(`${TOOL_URL}/${id}/damage`, payload),
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

  /** Quét và gửi ngay email nhắc các phiếu quá hạn, không cần chờ job theo giờ */
  notifyOverdueNow: () => axios.post(`${BORROW_URL}/notify-overdue`),
};