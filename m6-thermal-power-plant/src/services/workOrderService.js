import apiClient from './apiClient';

// BASE_URL rỗng ở dev (đi qua Vite proxy /api → backend) hoặc VITE_API_BASE_URL
// ở production — khớp với apiClient.js/departmentService.js/accountService.js.
// KHÔNG dùng VITE_API_URL (biến khác, chỉ có trong .env local, KHÔNG có trong
// .env.production) — dùng sai sẽ ra "undefined/..." khi build production.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BASE = `${BASE_URL}/api/v1/work-orders`;

/** Cộng thêm ngày vào chuỗi "yyyy-MM-dd" bằng UTC — tránh lệch ngày theo múi giờ. */
function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * NGÀY xin làm tiếp của lần gia hạn KẾ TIẾP. Mỗi lần gia hạn kéo dài đúng 1
 * ngày nên ngày này luôn là hôm sau ngày làm việc gần nhất đã được phép:
 *  - phiếu ĐÃ có gia hạn được duyệt -> allowedDate mới nhất + 1 ngày
 *  - chưa có gia hạn nào            -> ngày bắt đầu phiếu + 1 ngày
 *
 * Tổ trưởng KHÔNG chọn được ngày này (chỉ xem); Trưởng ca mới chốt allowedDate
 * lúc duyệt và có thể lùi xa hơn nếu chưa cô lập được thiết bị.
 *
 * @param {string} [startTime]    WorkOrder.startTime (ISO datetime)
 * @param {Array}  [extensions]   WorkOrderExtensionDTO[] (cần allowedDate)
 * @returns {string} "yyyy-MM-dd", hoặc '' nếu không suy ra được
 */
export function nextExtensionDate(startTime, extensions) {
  const granted = (extensions || []).map((e) => e.allowedDate).filter(Boolean).sort();
  const base = granted.length
    ? granted[granted.length - 1]
    : (startTime ? String(startTime).slice(0, 10) : null);
  return base ? addDays(base, 1) : '';
}

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
  getAll: ({ code, description, fromDate, toDate } = {}, page = 0, size = 20) =>
    apiClient.get(`${BASE}`, { params: { code, description, fromDate, toDate, page, size } }),

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
   *   (KHÔNG có mốc kết thúc — end_time là giờ kết thúc THỰC TẾ, hệ thống tự ghi
   *    khi phiếu hoàn thành)
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
   * Hoàn thành phiếu công tác (chỉ đổi status → COMPLETED, không sửa gì khác).
   * Idempotent nếu đã COMPLETED; 409 nếu CANCELLED / đang chờ duyệt gia hạn.
   * → PATCH /api/v1/work-orders/{id}/complete
   */
  complete: (id) => apiClient.patch(`${BASE}/${id}/complete`),

  /**
   * Tổ trưởng XIN GIA HẠN: status → WAITING_FOR_APPROVAL + tạo dòng gia hạn
   * chờ Trưởng ca ký bản giấy.
   *
   * UI chỉ cho gọi khi phiếu ĐANG TẠM DỪNG (STOPPED) — hết ngày phải dừng việc
   * và trả phiếu giấy về phòng Trưởng ca trước, hôm sau mới xin làm tiếp.
   * Backend vẫn nhận từ mọi trạng thái đang sống (giữ đường lùi cho hiện trường).
   * → PATCH /api/v1/work-orders/{id}/stop
   * @param id
   * @param {string} reason - Lý do gửi duyệt / xin làm tiếp (bắt buộc). KHÔNG
   *                          gửi ngày: ngày cho phép làm tiếp do Trưởng ca chốt
   *                          lúc duyệt (xem approveExtension).
   */
  stop: (id, reason) => apiClient.patch(`${BASE}/${id}/stop`, { reason }),

  /**
   * Trưởng ca duyệt gia hạn: ghi nhận tài khoản đang đăng nhập vào "Người cho
   * phép" + chốt ngày cho đơn vị công tác làm tiếp.
   * → PATCH /api/v1/work-orders/{id}/approve-extension?allowedDate=yyyy-MM-dd
   * @param {number} id
   * @param {string} [allowedDate] - Ngày cho phép tiếp tục làm việc (yyyy-MM-dd);
   *                                 bỏ trống = hôm sau ngày Tổ trưởng gửi duyệt.
   */
  approveExtension: (id, allowedDate) =>
    apiClient.patch(`${BASE}/${id}/approve-extension`, null, { params: { allowedDate } }),

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
   *   OPEN ─duyệt phiếu─► APPROVED ─bắt đầu─► IN_PROGRESS ─không kịp─► STOPPED
   *   ─gửi duyệt lại─► WAITING_FOR_APPROVAL ─duyệt gia hạn─► APPROVED ─► ...
   *   ─► COMPLETED; mọi trạng thái sống ─► CANCELLED.
   * → PATCH /api/v1/work-orders/{id}/status
   * @param id
   * @param {object} data
   * @param {string} data.targetStatus   - Trạng thái đích (bắt buộc)
   * @param {string} [data.reason]      - Bắt buộc khi target = WAITING_FOR_APPROVAL
   * @param {string} [data.allowedDate] - Ngày cho phép làm tiếp (yyyy-MM-dd), chỉ
   *                                      dùng khi duyệt gia hạn (target = APPROVED
   *                                      từ WAITING_FOR_APPROVAL)
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