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
   * Lấy danh sách phiếu công tác (có phân trang + 4 bộ lọc độc lập kết hợp
   * AND, bỏ trống = không lọc).
   * Backend sắp mặc định theo TIẾN ĐỘ: OPEN → đang làm (APPROVED/IN_PROGRESS/
   * STOPPED) → chờ duyệt gia hạn → hoàn thành → huỷ; cùng nhóm thì phiếu mới
   * tạo đứng trước (không truyền sort để giữ thứ tự này).
   * → GET /api/v1/work-orders
   * @param {object} filters
   * @param {string} [filters.code] - ID phiếu (khi là số) / mã PCT / mã nhân viên tổ trưởng (KHÔNG tìm theo mã yêu cầu hay nội dung sự cố)
   * @param {string} [filters.description] - Từ khoá tìm theo mô tả sửa chữa
   * @param {string} [filters.fromDate] - Chỉ lấy phiếu bắt đầu từ ngày này (yyyy-MM-dd)
   * @param {string} [filters.toDate] - Chỉ lấy phiếu bắt đầu đến HẾT ngày này (yyyy-MM-dd)
   * @param {number} page - Trang (0-based)
   * @param {number} size - Số dòng / trang
   */
  getAll: ({ code, description, fromDate, toDate, type } = {}, page = 0, size = 20) =>
    apiClient.get(`${BASE}`, { params: { code, description, fromDate, toDate, type, page, size } }),

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
   * Tạo phiếu công tác (PCT) — 2 chế độ, backend dispatch theo field có mặt:
   *  - Từ yêu cầu sửa chữa: `repairRequestId` (thiết bị lấy từ request).
   *  - Thủ công nhiều thiết bị: `equipmentIds` (không cần RepairRequest).
   * XOR: phải có đúng 1 trong 2, không được cả hai (400 nếu sai).
   * → POST /api/v1/work-orders
   * Body khớp với CreateWorkOrderRequest DTO:
   * @param {object} data
   * @param {number}  [data.repairRequestId]
   * @param {number[]} [data.equipmentIds]        - danh sách id thiết bị (chế độ thủ công)
   * @param {number}  data.leaderId               - bắt buộc
   * @param {number}  data.directSupervisorId      - bắt buộc
   * @param {number}  data.safetySupervisorId      - bắt buộc
   * @param {string}  data.startTime               - bắt buộc (ISO datetime)
   * @param {string}  [data.repairDescription]     - mô tả công việc
   *   (KHÔNG có mốc kết thúc — end_time là giờ kết thúc THỰC TẾ, hệ thống tự ghi
   *    khi phiếu hoàn thành)
   * @param {Array<{employeeId: number, roleInTask?: string}>} [data.members]
   */
  create: (data) => apiClient.post(`${BASE}`, data),

  /**
   * Huỷ một phiếu công tác (đặt status = CANCELLED).
   *
   * Ba điều kiện chồng lên nhau, backend chặn cả ba:
   *  - role TEAM_LEADER / MAINTENANCE_FOREMAN (403 nếu sai)
   *  - phải ĐÚNG người tạo phiếu (403 nếu không) — ADMIN không được miễn trừ
   *  - phiếu CHƯA chạy ngày công tác nào (409 nếu đã chạy)
   * → PATCH /api/v1/work-orders/{id}/cancel
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
   * Id nhân viên ĐANG BẬN ở một phiếu công tác sống bất kỳ (giữ vai trò phụ
   * trách hoặc là thành viên chưa rời) — dùng để ẩn khỏi gợi ý khi thêm nhân sự.
   * → GET /api/v1/work-orders/busy-employees
   * @param {number} [excludeWorkOrderId] - Bỏ qua phiếu này khi xét (thao tác trên chính nó)
   * @param {string[]} [statuses] - Chỉ xét phiếu có status thuộc danh sách
   *   (VD ['IN_PROGRESS'] cho ô Người giám sát an toàn); bỏ trống = mọi trạng thái sống
   */
  getBusyEmployees: (excludeWorkOrderId, statuses) =>
    apiClient.get(`${BASE}/busy-employees`, {
      params: { excludeWorkOrderId, statuses: statuses?.length ? statuses.join(',') : undefined },
    }),

  /**
   * Lịch sử phiếu cấp vật tư TIÊU HAO của một phiếu công tác, mới nhất trước.
   * → GET /api/v1/work-orders/{workOrderId}/consumable-issues
   */
  getConsumableIssues: (workOrderId) => apiClient.get(`${BASE}/${workOrderId}/consumable-issues`),

  /**
   * Tạo phiếu cấp vật tư TIÊU HAO cho một phiếu công tác. issuedBy lấy từ JWT
   * principal — client KHÔNG truyền.
   * → POST /api/v1/work-orders/{workOrderId}/consumable-issues
   * @param workOrderId
   * @param {object} data
   * @param {Array<{consumableId: number, quantity: number}>} data.items
   */
  createConsumableIssue: (workOrderId, data) =>
    apiClient.post(`${BASE}/${workOrderId}/consumable-issues`, data),

  /**
   * Tải bản in PDF "Phiếu đề nghị cấp phát vật tư, trang thiết bị" của MỘT phiếu
   * cấp vật tư (backend đồng thời upload Cloudinary + lưu pdf_path).
   * → GET /api/v1/work-orders/{workOrderId}/consumable-issues/{issueId}/pdf
   */
  exportConsumableIssuePdf: (workOrderId, issueId) =>
    apiClient.get(`${BASE}/${workOrderId}/consumable-issues/${issueId}/pdf`,
      { responseType: 'blob' }),

  /**
   * Tải bản in PDF của phiếu công tác (backend đồng thời upload Cloudinary).
   * → GET /api/v1/work-orders/{id}/pdf
   */
  exportPdf: (id) => apiClient.get(`${BASE}/${id}/pdf`, { responseType: 'blob' }),

  /**
   * "Khoá phiếu hoàn thành" (chỉ đổi status → COMPLETED, không sửa gì khác).
   * Đóng nốt ngày công tác còn đang mở. Idempotent nếu đã COMPLETED; 409 nếu CANCELLED.
   * → PATCH /api/v1/work-orders/{id}/complete
   */
  complete: (id) => apiClient.patch(`${BASE}/${id}/complete`),

  /**
   * "Khoá phiếu ngày" khi hết ngày mà chưa xong việc: đóng dòng nhật ký ngày
   * đang mở + status → STOPPED để hôm sau mở lại. 409 nếu phiếu không đang
   * IN_PROGRESS.
   * → PATCH /api/v1/work-orders/{id}/close-day
   * @param id
   * @param {string} [note] - Ghi chú, KHÔNG bắt buộc.
   */
  closeDay: (id, note) => apiClient.patch(`${BASE}/${id}/close-day`, { reason: note }),

  /**
   * Sửa thông tin phiếu đang sống (partial update — chỉ trường khác null được
   * ghi đè): leaderId / directSupervisorId / safetySupervisorId / startTime /
   * repairDescription. Backend KHÔNG áp ràng buộc lúc tạo (trùng vai trò);
   * phiếu COMPLETED/CANCELLED trả 409.
   * → PATCH /api/v1/work-orders/{id}
   */
  update: (id, data) => apiClient.patch(`${BASE}/${id}`, data),

  /**
   * Cập nhật TRẠNG THÁI phiếu — endpoint duy nhất cho modal "Cập nhật trạng thái":
   *   STOPPED ─mở phiếu ngày─► IN_PROGRESS ─khoá phiếu ngày─► STOPPED
   *                                 └─khoá phiếu hoàn thành─► COMPLETED;
   *   STOPPED ─huỷ (chưa chạy ngày nào, đúng người tạo)─► CANCELLED.
   * → PATCH /api/v1/work-orders/{id}/status
   * @param id
   * @param {object} data
   * @param {string} data.targetStatus - Trạng thái đích (bắt buộc)
   * @param {string} [data.reason]     - Ghi chú khi khoá phiếu ngày (target = STOPPED)
   */
  updateStatus: (id, data) => apiClient.patch(`${BASE}/${id}/status`, data),

  /**
   * "Mở phiếu ngày": ghi một dòng nhật ký ngày công tác + status → IN_PROGRESS.
   * Lần mở ĐẦU TIÊN chính là bắt đầu phiếu. 409 nếu phiếu không đang STOPPED.
   * → PATCH /api/v1/work-orders/{id}/open-day
   */
  openDay: (id) => apiClient.patch(`${BASE}/${id}/open-day`),

  /**
   * Cập nhật trạng thái làm việc của MỘT thiết bị trong PCT thủ công nhiều
   * thiết bị (IN_PROGRESS ↔ COMPLETED). Chỉ áp dụng cho WO thủ công còn sống;
   * 409 nếu phiếu từ yêu cầu / đã kết thúc / status = CANCELED; 404 nếu thiết
   * bị không thuộc phiếu.
   * → PATCH /api/v1/work-orders/{id}/equipment/{equipmentId}/status
   * @param {number} workOrderId
   * @param {number} equipmentId
   * @param {string} status - 'IN_PROGRESS' | 'COMPLETED'
   */
  updateEquipmentStatus: (workOrderId, equipmentId, status) =>
    apiClient.patch(`${BASE}/${workOrderId}/equipment/${equipmentId}/status`, { status }),
};