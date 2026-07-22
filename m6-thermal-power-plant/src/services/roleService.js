import apiClient from './apiClient';

const ROLE_URL = '/api/v1/roles';
const PERMISSION_URL = '/api/v1/permissions';


// Danh mục vai trò + helper phân quyền theo ROLE.
// (2026-07-20: chuyển hẳn từ mô hình permission sang role-only — xem BE
//  SecurityConfig#roleHierarchy. "Phân quyền" giờ = gán đúng ROLE cho account;
//  không còn màn cấu hình role×permission động.)

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
  { id: 11, roleCode: 'HR_STAFF', roleName: 'Nhân sự' },
];

/** ADMIN luôn full quyền (khớp RoleHierarchy phía BE: ROLE_ADMIN implies mọi role khác). */
export function isAdmin(user) {
  return !!user?.roles?.includes('ADMIN');
}

/**
 * Kiểm tra user hiện tại có thuộc 1 trong các role cho phép hay không.
 * ADMIN luôn qua, bất kể danh sách `roles` truyền vào — mirror đúng
 * RoleHierarchy phía BE nên không cần liệt kê ADMIN ở từng nơi gọi.
 *
 * Lưu ý: đây là lớp UX (ẩn/hiện menu, gate route). Chặn thật sự nằm ở
 * backend (@PreAuthorize hasAnyRole) — user sửa localStorage cũng chỉ thấy
 * menu/route, gọi API vẫn bị 403.
 *
 * @param {object|null} user
 * @param {string[]} [roles] - danh sách role được phép; rỗng/undefined = ai đã đăng nhập cũng qua.
 */
export function hasAnyRole(user, roles) {
  if (!user) return false;
  if (!roles || roles.length === 0) return true;
  if (isAdmin(user)) return true;
  const userRoles = user.roles || [];
  return roles.some((r) => userRoles.includes(r));
}

/**
 * API phân quyền động (role × permission) — phục vụ trang Quản trị
 * /admin/roles. Đây là tầng gọi API, giữ nguyên theo main.
 */
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

