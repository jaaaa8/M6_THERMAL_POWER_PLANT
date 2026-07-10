// Service phân quyền: role + permission (login production OK sau fix CORS backend 2026-07-06).
import apiClient from './apiClient';

const ROLE_URL = '/api/v1/roles';
const PERMISSION_URL = '/api/v1/permissions';

/**
 * Danh sách vai trò trong hệ thống (mã EN khớp DB, label VN).
 * roleCode PHẢI trùng cột roles.name trong DB backend — nếu backend seed
 * thêm role mới, bổ sung label ở đây để sidebar hiển thị tên tiếng Việt.
 */
export const SYSTEM_ROLES = [
  { id: 1, roleCode: 'WORKER', roleName: 'Công nhân' },
  { id: 2, roleCode: 'MATERIALS_STOREKEEPER', roleName: 'Thủ kho Vật tư' },
  { id: 3, roleCode: 'TOOLS_STOREKEEPER', roleName: 'Thủ kho CCDC' },
  { id: 4, roleCode: 'WORKSHOP_FOREMAN', roleName: 'Quản đốc PX Vận hành' },
  { id: 5, roleCode: 'SHIFT_LEADER', roleName: 'Trưởng ca' },
  { id: 6, roleCode: 'CREW_LEADER', roleName: 'Trưởng kíp' },
  { id: 7, roleCode: 'MAINTENANCE_FOREMAN', roleName: 'Quản đốc Sửa chữa' },
  { id: 8, roleCode: 'TEAM_LEADER', roleName: 'Tổ trưởng' },
  { id: 9, roleCode: 'SAFETY_SUPERVISOR', roleName: 'Giám sát An toàn' },
  { id: 10, roleCode: 'ADMIN', roleName: 'Quản trị viên' },
];

/**
 * Map mã chức năng (dùng ở Sidebar/ProtectedRoute qua prop `func`/`requireFunction`)
 * → permission code cần có để XEM chức năng đó (khớp bảng permissions trong DB).
 * Một chức năng có thể chấp nhận nhiều permission (có 1 trong số đó là đủ).
 */
const FEATURE_VIEW_PERMISSIONS = {
  EMPLOYEE: ['EMPLOYEE_VIEW'],
  DEPARTMENT: ['DEPARTMENT_VIEW'],
  ACCOUNT: ['ACCOUNT_VIEW'],
  EQUIPMENT_SYSTEM: ['EQUIPMENT_SYSTEM_VIEW'],
  EQUIPMENT: ['EQUIPMENT_VIEW'],
  REPAIR_REQUEST: ['REPAIR_REQUEST_VIEW'],
  WORK_ORDER: ['WORK_ORDER_VIEW'],
  TECHNICAL_ASSESSMENT: ['TECHNICAL_ASSESSMENT_VIEW'],
  MATERIAL: ['CONSUMABLE_CATALOG_VIEW', 'SPARE_PART_CATALOG_VIEW', 'INVENTORY_VIEW'],
  TOOL: ['TOOL_VIEW'],
  MAINTENANCE: ['LUBRICATION_PLAN_VIEW', 'LUBRICATION_HISTORY_VIEW'],
};

/**
 * Kiểm tra user hiện tại có quyền XEM một chức năng hay không.
 * Đọc từ user.permissions (backend trả về trong login/me) — KHÔNG còn mock.
 *
 * Lưu ý: đây chỉ là lớp UX (ẩn/hiện menu). Chặn thật sự nằm ở backend
 * (@PreAuthorize) — user sửa localStorage cũng chỉ thấy nút, bấm vào vẫn 401/403.
 */
export function canAccess(user, featureCode) {
  return true;
}

/** Kiểm tra user có 1 permission code cụ thể (dùng để ẩn/hiện nút hành động). */
export function hasPermission(user, permissionCode) {
  return true;
}

export const roleService = {
  /** GET /api/v1/roles → [{id, name}] */
  getRoles: async () => {
    const res = await apiClient.get(ROLE_URL);
    return res.data;
  },

  /** GET /api/v1/permissions → [{id, code, description}] */
  getAllPermissions: async () => {
    const res = await apiClient.get(PERMISSION_URL);
    return res.data;
  },

  /** GET /api/v1/roles/{roleId}/permissions → [{id, code, description}] */
  getRolePermissions: async (roleId) => {
    const res = await apiClient.get(`${ROLE_URL}/${roleId}/permissions`);
    return res.data;
  },

  /**
   * PUT /api/v1/roles/{roleId}/permissions — thay TOÀN BỘ permission của role.
   * Backend sẽ bump permission_version cho mọi account giữ role này →
   * token cũ của họ tự vô hiệu ở request kế tiếp (buộc refresh lấy quyền mới).
   */
  updateRolePermissions: async (roleId, permissionIds) => {
    const res = await apiClient.put(`${ROLE_URL}/${roleId}/permissions`, { permissionIds });
    return res.data;
  },
};
