import apiClient from './apiClient';

// BASE_URL rỗng ở dev (đi qua Vite proxy /api → backend) hoặc VITE_API_BASE_URL
// ở production — khớp với apiClient.js/departmentService.js/accountService.js.
// KHÔNG dùng VITE_API_URL (biến khác, chỉ có trong .env local, KHÔNG có trong
// .env.production) — dùng sai sẽ ra "undefined/..." khi build production.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BASE = `${BASE_URL}/api/v1/work-orders`;

export const workOrderService = {
  /**
   * Lấy danh sách yêu cầu sửa chữa đang chờ xử lý (status = PENDING).
   * → GET /api/maintenance/repair-requests/pending
   * @param {number} page - Trang (0-based)
   * @param {number} size - Số dòng / trang
   */
  getPendingRequests: (page = 0, size = 20) =>
    apiClient.get(`${BASE_URL}/api/v1/repair-requests/pending`, { params: { page, size, sort: 'createdAt,desc' } }),

  /**
   * Lấy danh sách phiếu công tác (có phân trang + tìm kiếm).
   * → GET /api/maintenance/work-orders
   * @param {string} search - Từ khoá tìm trong mã PCT / mã yêu cầu / nội dung
   * @param {number} page - Trang (0-based)
   * @param {number} size - Số dòng / trang
   */
  getAll: (search, page = 0, size = 20) =>
    apiClient.get(`${BASE}`, { params: { search, page, size } }),

  /**
   * Tạo phiếu công tác từ một yêu cầu sửa chữa.
   * → POST /api/maintenance/work-orders
   * Body khớp với CreateWorkOrderRequest DTO:
   * @param {object} data
   * @param {number}  data.repairRequestId
   * @param {number}  data.leaderId               - bắt buộc
   * @param {number}  data.directSupervisorId      - bắt buộc
   * @param {number}  data.safetySupervisorId      - bắt buộc
   * @param {string}  data.startTime               - bắt buộc (ISO datetime)
   * @param {string}  [data.expectedEndTime]       - tuỳ chọn (ISO datetime)
   * @param {Array<{employeeId: number, roleInTask?: string}>} [data.members]
   */
  create: (data) => apiClient.post(`${BASE}`, data),

  /**
   * Huỷ một phiếu công tác (đặt status = CANCELLED).
   * → PATCH /api/maintenance/work-orders/{id}/cancel
   */
  cancel: (id) => apiClient.patch(`${BASE}/${id}/cancel`),
};