import apiClient from './apiClient';

const API_URL = '/api/v1/roles';

/**
 * Danh sách vai trò trong hệ thống (mã EN, label VN).
 * Đồng bộ với docs/ROLE_CODES.md — BE phải seed cùng bộ này.
 */
export const SYSTEM_ROLES = [
  { id: 1, roleCode: 'ADMIN', roleName: 'Quản trị viên' },
  { id: 2, roleCode: 'HR_STAFF', roleName: 'Nhân sự' },
  { id: 3, roleCode: 'MATERIAL_KEEPER', roleName: 'Thủ kho Vật tư' },
  { id: 4, roleCode: 'TOOL_KEEPER', roleName: 'Thủ kho CCDC' },
  { id: 5, roleCode: 'OPERATIONS_MANAGER', roleName: 'Quản đốc PX Vận hành' },
  { id: 6, roleCode: 'SHIFT_LEADER', roleName: 'Trưởng ca' },
  { id: 7, roleCode: 'WATCH_LEADER', roleName: 'Trưởng kíp' },
  { id: 8, roleCode: 'REPAIR_MANAGER', roleName: 'Quản đốc sửa chữa' },
  { id: 9, roleCode: 'TEAM_LEADER', roleName: 'Tổ trưởng' },
];

/**
 * Danh sách chức năng (featureCode EN, name VN).
 */
export const SYSTEM_FUNCTIONS = [
  { id: 1, featureCode: 'EMPLOYEE', featureName: 'Quản lý Nhân sự', groupName: 'Nhân sự' },
  { id: 2, featureCode: 'DEPARTMENT', featureName: 'Quản lý Phòng ban', groupName: 'Nhân sự' },
  { id: 3, featureCode: 'ACCOUNT', featureName: 'Quản lý Tài khoản', groupName: 'Nhân sự' },
  { id: 4, featureCode: 'EQUIPMENT_SYSTEM', featureName: 'Quản lý Hệ thống', groupName: 'Thiết bị' },
  { id: 5, featureCode: 'EQUIPMENT', featureName: 'Quản lý Thiết bị', groupName: 'Thiết bị' },
  { id: 6, featureCode: 'REPAIR_REQUEST', featureName: 'Yêu cầu Sửa chữa', groupName: 'Sửa chữa' },
  { id: 7, featureCode: 'WORK_ORDER', featureName: 'Phiếu Công tác', groupName: 'Sửa chữa' },
  { id: 8, featureCode: 'TECHNICAL_ASSESSMENT', featureName: 'Đánh giá Kỹ thuật', groupName: 'Sửa chữa' },
  { id: 9, featureCode: 'MATERIAL', featureName: 'Quản lý Vật tư', groupName: 'Kho' },
  { id: 10, featureCode: 'TOOL', featureName: 'Công cụ Dụng cụ', groupName: 'Kho' },
  { id: 11, featureCode: 'MAINTENANCE', featureName: 'Bảo dưỡng Định kỳ', groupName: 'Bảo dưỡng' },
];

export const PERMISSION_ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE'];

export const PERMISSION_LABELS = {
  VIEW: 'Xem',
  CREATE: 'Thêm',
  UPDATE: 'Sửa',
  DELETE: 'Xoá',
};

/**
 * Ma trận phân quyền — mock. Key: `${roleCode}_${featureCode}_${action}`.
 */
let mockPermissions = {};

function initPermissions() {
  const rules = {
    HR_STAFF: ['EMPLOYEE', 'DEPARTMENT', 'ACCOUNT'],
    MATERIAL_KEEPER: ['MATERIAL'],
    TOOL_KEEPER: ['TOOL'],
    OPERATIONS_MANAGER: ['EQUIPMENT_SYSTEM', 'EQUIPMENT', 'REPAIR_REQUEST'],
    SHIFT_LEADER: ['REPAIR_REQUEST', 'WORK_ORDER'],
    WATCH_LEADER: ['REPAIR_REQUEST'],
    REPAIR_MANAGER: ['REPAIR_REQUEST', 'WORK_ORDER', 'TECHNICAL_ASSESSMENT', 'MATERIAL', 'TOOL'],
    TEAM_LEADER: ['WORK_ORDER', 'TECHNICAL_ASSESSMENT', 'MAINTENANCE'],
  };

  // Một số role chỉ có quyền VIEW + CREATE (không UPDATE/DELETE).
  const readCreateOnly = new Set(['SHIFT_LEADER', 'WATCH_LEADER']);

  SYSTEM_ROLES.forEach((role) => {
    SYSTEM_FUNCTIONS.forEach((func) => {
      PERMISSION_ACTIONS.forEach((action) => {
        const key = `${role.roleCode}_${func.featureCode}_${action}`;
        if (role.roleCode === 'ADMIN') {
          mockPermissions[key] = true;
        } else if (rules[role.roleCode]?.includes(func.featureCode)) {
          mockPermissions[key] = readCreateOnly.has(role.roleCode)
            ? action === 'VIEW' || action === 'CREATE'
            : true;
        } else {
          mockPermissions[key] = false;
        }
      });
    });
  });
}

initPermissions();

/**
 * Kiểm tra một Role có quyền XEM một chức năng hay không.
 */
export function canAccess(role, featureCode) {
  if (!role || !featureCode) return false;
  if (role === 'ADMIN') return true;
  return !!mockPermissions[`${role}_${featureCode}_VIEW`];
}

export function getAccessibleFunctions(role) {
  if (!role) return [];
  if (role === 'ADMIN') return SYSTEM_FUNCTIONS.map((f) => f.featureCode);
  return SYSTEM_FUNCTIONS
    .filter((f) => mockPermissions[`${role}_${f.featureCode}_VIEW`])
    .map((f) => f.featureCode);
}

export const roleService = {
  getRolePermissions: () => {
    // TODO: return apiClient.get(`${API_URL}/permissions`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            roles: SYSTEM_ROLES,
            functions: SYSTEM_FUNCTIONS,
            actions: PERMISSION_ACTIONS,
            permissions: { ...mockPermissions },
          },
        });
      }, 300);
    });
  },

  updatePermissions: (updatedPermissions) => {
    // TODO: return apiClient.put(`${API_URL}/permissions`, updatedPermissions);
    return new Promise((resolve) => {
      mockPermissions = { ...updatedPermissions };
      setTimeout(() => {
        resolve({ data: { message: 'Cập nhật phân quyền thành công' } });
      }, 400);
    });
  },
};
