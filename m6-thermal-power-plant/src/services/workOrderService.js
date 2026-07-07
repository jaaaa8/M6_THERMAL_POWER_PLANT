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
   * Lấy chi tiết một phiếu công tác bao gồm:
   * - Thông tin chung (mã PCT, thiết bị, leader, supervisors)
   * - Danh sách thành viên hiện tại (leftAt = null)
   * - Lịch sử timeline (JOINED/LEFT events sorted by time)
   * → GET /api/v1/work-orders/{id}
   * @param {number} id - ID phiếu công tác
   */
  getById: (id) => apiClient.get(`${BASE_URL}/api/v1/work-orders/${id}`),

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

  /**
   * Thêm nhân viên vào phiếu đang chạy (join). Nhân viên từng rời có thể vào
   * lại — backend tạo dòng member mới nên lịch sử giữ đủ cặp JOINED/LEFT.
   * → POST /api/v1/work-orders/{id}/members
   * @param {number} id - ID phiếu công tác
   * @param {number} employeeId - ID nhân viên cần thêm
   */
  addMember: (id, employeeId) => apiClient.post(`${BASE}/${id}/members`, { employeeId }),

  /**
   * Đánh dấu thành viên rời khu vực làm việc (set leftAt = now, idempotent).
   * → PATCH /api/v1/work-orders/{id}/members/{memberId}/leave
   * @param {number} id - ID phiếu công tác
   * @param {number} memberId - ID dòng member (KHÔNG phải employeeId)
   */
  leaveMember: (id, memberId) => apiClient.patch(`${BASE}/${id}/members/${memberId}/leave`),

  /**
   * Lịch sử phiếu cấp vật tư của một phiếu công tác.
   * → GET /api/v1/work-orders/{workOrderId}/supplies-issues
   * Trả về { sparePartsIssues: [...], consumableIssues: [...] }
   */
  getSuppliesIssues: (workOrderId) => apiClient.get(`${BASE}/${workOrderId}/supplies-issues`),

  /**
   * Tạo phiếu cấp vật tư GỘP (thay thế + tiêu hao) cho một phiếu công tác.
   * issuedBy lấy từ JWT principal — client KHÔNG truyền.
   * → POST /api/v1/work-orders/{workOrderId}/supplies-issues
   * @param {object} data
   * @param {Array<{sparePartId: number, quantity: number}>} [data.spareParts]
   * @param {Array<{consumableId: number, quantity: number}>} [data.consumables]
   *        Ít nhất một trong hai danh sách phải có dòng.
   */
  createSuppliesIssue: (workOrderId, data) =>
    apiClient.post(`${BASE}/${workOrderId}/supplies-issues`, data),

  /**
   * Tải bản in PDF của phiếu công tác (backend đồng thời upload Cloudinary).
   * → GET /api/v1/work-orders/{id}/pdf
   */
  exportPdf: (id) => apiClient.get(`${BASE}/${id}/pdf`, { responseType: 'blob' }),

  /**
   * Tải bản in PDF "Phiếu đề nghị cấp phát vật tư": MỘT file gom tất cả dòng
   * vật tư (thay thế + tiêu hao) đã cấp cho phiếu công tác. Backend trả 409
   * nếu PCT chưa được cấp vật tư lần nào.
   * → GET /api/v1/work-orders/{workOrderId}/supplies-issues/pdf
   */
  exportSuppliesIssuePdf: (workOrderId) =>
    apiClient.get(`${BASE}/${workOrderId}/supplies-issues/pdf`, { responseType: 'blob' }),

  /**
   * Hoàn thành phiếu công tác (chỉ đổi status → COMPLETED, không sửa gì khác).
   * Idempotent nếu đã COMPLETED; 409 nếu CANCELLED / đang chờ duyệt gia hạn.
   * → PATCH /api/v1/work-orders/{id}/complete
   */
  complete: (id) => apiClient.patch(`${BASE}/${id}/complete`),

  /**
   * Tổ trưởng GỬI DUYỆT / TẠM DỪNG phiếu (từ mọi trạng thái đang sống):
   * status → WAITING_FOR_APPROVAL + tạo dòng gia hạn chờ Trưởng ca ký bản giấy.
   * Dùng cho cả phiếu OPEN xin duyệt trước khi làm lẫn tạm dừng cuối ngày.
   * → PATCH /api/v1/work-orders/{id}/stop
   * @param {string} reason        - Lý do gửi duyệt / xin làm tiếp (bắt buộc)
   * @param {string} extendedUntil - Xin phép đến ngày (ISO datetime, bắt buộc)
   */
  stop: (id, reason, extendedUntil) =>
    apiClient.patch(`${BASE}/${id}/stop`, { reason, extendedUntil }),

  /**
   * Sửa thông tin phiếu đang sống (partial update — chỉ trường khác null được
   * ghi đè): leaderId / directSupervisorId / safetySupervisorId / startTime /
   * expectedEndTime / repairDescription. Backend KHÔNG áp ràng buộc lúc tạo
   * (trùng vai trò, chồng lấn giờ); phiếu COMPLETED/CANCELLED trả 409.
   * → PATCH /api/v1/work-orders/{id}
   */
  update: (id, data) => apiClient.patch(`${BASE}/${id}`, data),

  /**
   * Cập nhật TRẠNG THÁI phiếu — endpoint duy nhất cho modal "Cập nhật trạng thái":
   *   OPEN ─duyệt phiếu─► APPROVED ─bắt đầu─► IN_PROGRESS ─không kịp─► STOPPED
   *   ─gửi duyệt lại─► WAITING_FOR_APPROVAL ─duyệt gia hạn─► APPROVED ─► ...
   *   ─► COMPLETED; mọi trạng thái sống ─► CANCELLED.
   * → PATCH /api/v1/work-orders/{id}/status
   * @param {object} data
   * @param {string} data.targetStatus   - Trạng thái đích (bắt buộc)
   * @param {string} [data.reason]        - Bắt buộc khi target = WAITING_FOR_APPROVAL
   * @param {string} [data.extendedUntil] - Bắt buộc khi target = WAITING_FOR_APPROVAL
   */
  updateStatus: (id, data) => apiClient.patch(`${BASE}/${id}/status`, data),

  /**
   * Ghi nhận online việc Trưởng ca ĐÃ ký duyệt bản giấy (người bấm chịu trách
   * nhiệm nhập đúng theo bản giấy — tài khoản của họ được lưu vào approvedBy).
   * status → APPROVED.
   * → PATCH /api/v1/work-orders/{id}/approve-extension
   */
  approveExtension: (id) => apiClient.patch(`${BASE}/${id}/approve-extension`),

  /**
   * Mở (lại) phiếu để làm việc: OPEN → IN_PROGRESS (bắt đầu lần đầu) hoặc
   * APPROVED → IN_PROGRESS (bật lại nút đã tắt hôm trước, sau khi duyệt).
   * → PATCH /api/v1/work-orders/{id}/reopen
   */
  reopen: (id) => apiClient.patch(`${BASE}/${id}/reopen`),
};