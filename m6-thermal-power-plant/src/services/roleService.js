import axios from 'axios';

const API_URL = '/api/vai-tro';

/**
 * Danh sách vai trò trong hệ thống
 */
export const SYSTEM_ROLES = [
  { id: 1, maVaiTro: 'ADMIN', tenVaiTro: 'Quản trị viên' },
  { id: 2, maVaiTro: 'NHAN_SU', tenVaiTro: 'Nhân sự' },
  { id: 3, maVaiTro: 'THU_KHO_VT', tenVaiTro: 'Thủ kho Vật tư' },
  { id: 4, maVaiTro: 'THU_KHO_CCDC', tenVaiTro: 'Thủ kho CCDC' },
  { id: 5, maVaiTro: 'QUAN_DOC', tenVaiTro: 'Quản đốc' },
  { id: 6, maVaiTro: 'TRUONG_CA', tenVaiTro: 'Trưởng ca / Trưởng kíp' },
  { id: 7, maVaiTro: 'TO_TRUONG', tenVaiTro: 'Tổ trưởng' },
];

/**
 * Danh sách chức năng trong hệ thống
 */
export const SYSTEM_FUNCTIONS = [
  { id: 1, maChucNang: 'NHAN_SU', tenChucNang: 'Quản lý Nhân sự', nhom: 'Nhân sự' },
  { id: 2, maChucNang: 'PHONG_BAN', tenChucNang: 'Quản lý Phòng ban', nhom: 'Nhân sự' },
  { id: 3, maChucNang: 'TAI_KHOAN', tenChucNang: 'Quản lý Tài khoản', nhom: 'Nhân sự' },
  { id: 4, maChucNang: 'HE_THONG', tenChucNang: 'Quản lý Hệ thống', nhom: 'Thiết bị' },
  { id: 5, maChucNang: 'THIET_BI', tenChucNang: 'Quản lý Thiết bị', nhom: 'Thiết bị' },
  { id: 6, maChucNang: 'YEU_CAU_SC', tenChucNang: 'Yêu cầu Sửa chữa', nhom: 'Sửa chữa' },
  { id: 7, maChucNang: 'PHIEU_CT', tenChucNang: 'Phiếu Công tác', nhom: 'Sửa chữa' },
  { id: 8, maChucNang: 'DANH_GIA_KT', tenChucNang: 'Đánh giá Kỹ thuật', nhom: 'Sửa chữa' },
  { id: 9, maChucNang: 'VAT_TU', tenChucNang: 'Quản lý Vật tư', nhom: 'Kho' },
  { id: 10, maChucNang: 'CCDC', tenChucNang: 'Công cụ Dụng cụ', nhom: 'Kho' },
  { id: 11, maChucNang: 'BAO_DUONG', tenChucNang: 'Bảo dưỡng Định kỳ', nhom: 'Bảo dưỡng' },
];

/**
 * Các quyền (actions)
 */
export const PERMISSION_ACTIONS = ['XEM', 'THEM', 'SUA', 'XOA'];

export const PERMISSION_LABELS = {
  XEM: 'Xem',
  THEM: 'Thêm',
  SUA: 'Sửa',
  XOA: 'Xóa',
};

/**
 * Mock data: Ma trận phân quyền
 * Key format: `${maVaiTro}_${maChucNang}_${action}` → boolean
 */
let mockPermissions = {};

// Init: ADMIN full quyền, các role khác có quyền cơ bản
function initPermissions() {
  SYSTEM_ROLES.forEach((role) => {
    SYSTEM_FUNCTIONS.forEach((func) => {
      PERMISSION_ACTIONS.forEach((action) => {
        const key = `${role.maVaiTro}_${func.maChucNang}_${action}`;
        if (role.maVaiTro === 'ADMIN') {
          mockPermissions[key] = true;
        } else if (role.maVaiTro === 'NHAN_SU' && ['NHAN_SU', 'PHONG_BAN', 'TAI_KHOAN'].includes(func.maChucNang)) {
          mockPermissions[key] = true;
        } else if (role.maVaiTro === 'THU_KHO_VT' && func.maChucNang === 'VAT_TU') {
          mockPermissions[key] = true;
        } else if (role.maVaiTro === 'THU_KHO_CCDC' && func.maChucNang === 'CCDC') {
          mockPermissions[key] = true;
        } else if (role.maVaiTro === 'QUAN_DOC' && ['HE_THONG', 'THIET_BI', 'PHIEU_CT'].includes(func.maChucNang)) {
          mockPermissions[key] = true;
        } else if (role.maVaiTro === 'TRUONG_CA' && ['YEU_CAU_SC', 'PHIEU_CT'].includes(func.maChucNang)) {
          mockPermissions[key] = action === 'XEM' || action === 'THEM';
        } else if (role.maVaiTro === 'TO_TRUONG' && ['PHIEU_CT', 'DANH_GIA_KT', 'BAO_DUONG'].includes(func.maChucNang)) {
          mockPermissions[key] = true;
        } else {
          mockPermissions[key] = false;
        }
      });
    });
  });
}

initPermissions();

/**
 * Kiểm tra một Role có quyền XEM một chức năng hay không (đồng bộ).
 * Dùng cho gating route & lọc menu Sidebar.
 * @param {string} role - mã vai trò (vd: 'TRUONG_CA')
 * @param {string} maChucNang - mã chức năng (vd: 'YEU_CAU_SC')
 * @returns {boolean}
 */
export function canAccess(role, maChucNang) {
  if (!role || !maChucNang) return false;
  return !!mockPermissions[`${role}_${maChucNang}_XEM`];
}

/**
 * Lấy danh sách mã chức năng mà Role được XEM (đồng bộ).
 * @param {string} role
 * @returns {string[]}
 */
export function getAccessibleFunctions(role) {
  if (!role) return [];
  return SYSTEM_FUNCTIONS
    .filter((f) => mockPermissions[`${role}_${f.maChucNang}_XEM`])
    .map((f) => f.maChucNang);
}

export const roleService = {
  /**
   * Lấy toàn bộ ma trận phân quyền
   * @returns {{ roles, functions, actions, permissions }}
   */
  getRolePermissions: () => {
    // TODO: return axios.get(`${API_URL}/permissions`);
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
      }, 500);
    });
  },

  /**
   * Cập nhật ma trận phân quyền
   * @param {object} updatedPermissions - Object key-value giống mockPermissions
   */
  updatePermissions: (updatedPermissions) => {
    // TODO: return axios.put(`${API_URL}/permissions`, updatedPermissions);
    return new Promise((resolve) => {
      mockPermissions = { ...updatedPermissions };
      setTimeout(() => {
        resolve({ data: { message: 'Cập nhật phân quyền thành công' } });
      }, 600);
    });
  },
};
