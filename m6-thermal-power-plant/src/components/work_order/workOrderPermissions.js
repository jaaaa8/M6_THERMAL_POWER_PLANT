/**
 * Gating vai trò cho phiếu công tác — dùng chung giữa danh sách và modal trạng
 * thái, để luật quyền ở FE chỉ nằm đúng một chỗ. Đây CHỈ là gating hiển thị;
 * backend mới là nơi chặn thật (@PreAuthorize + guard trong MaintenanceService).
 */
import { authService } from '../../services/authService';

/** Mở / khoá phiếu ngày, khoá phiếu hoàn thành. */
export const OPERATE_ROLES = ['SHIFT_LEADER', 'CREW_LEADER', 'ADMIN'];

/** Huỷ phiếu: người CẤP phiếu. Role thôi chưa đủ — xem canCancel(). */
export const CANCEL_ROLES = ['TEAM_LEADER', 'MAINTENANCE_FOREMAN'];

/**
 * Ba điều kiện huỷ chồng lên nhau: đúng role, ĐÚNG người tạo phiếu, và phiếu
 * chưa chạy ngày công tác nào (phiếu IN_PROGRESS thì hiển nhiên đã chạy).
 *
 * Hàm này kiểm được hai điều kiện đầu từ chính dòng danh sách — WorkOrderDTO
 * đã mang sẵn status + createdById. Điều kiện "chưa chạy ngày nào" phải chờ
 * fetch chi tiết nên nằm ở WorkOrderStatusModal; nghĩa là danh sách vẫn có thể
 * hiện thừa nút ở phiếu đã chạy rồi quay về Tạm dừng — modal sẽ ẩn option huỷ,
 * và backend chặn bằng 409 nếu ai đó gọi thẳng API.
 */
export function canCancel(workOrder, userRoles) {
  if (!workOrder || workOrder.status !== 'STOPPED') return false;
  if (!CANCEL_ROLES.some((r) => userRoles.includes(r))) return false;
  const me = authService.getCurrentUser()?.accountId;
  return me != null && workOrder.createdById === me;
}
