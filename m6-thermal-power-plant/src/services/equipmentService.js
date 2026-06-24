import axios from 'axios';

const API_URL = '/api/thiet-bi';

/**
 * Mock danh sách thiết bị — dùng cho dropdown tạo yêu cầu sửa chữa
 */
const MOCK_EQUIPMENT = [
  { id: 1, maKKS: 'MAA10', tenThietBi: 'Lò hơi #1', heThong: 'Hệ thống Lò hơi' },
  { id: 2, maKKS: 'MAA20', tenThietBi: 'Lò hơi #2', heThong: 'Hệ thống Lò hơi' },
  { id: 3, maKKS: 'MAG10', tenThietBi: 'Tua-bin hơi #1', heThong: 'Hệ thống Tua-bin' },
  { id: 4, maKKS: 'MAG20', tenThietBi: 'Tua-bin hơi #2', heThong: 'Hệ thống Tua-bin' },
  { id: 5, maKKS: 'MKA10', tenThietBi: 'Máy phát điện #1', heThong: 'Hệ thống Phát điện' },
  { id: 6, maKKS: 'MKA20', tenThietBi: 'Máy phát điện #2', heThong: 'Hệ thống Phát điện' },
  { id: 7, maKKS: 'PAB10', tenThietBi: 'Bơm nước cấp #1', heThong: 'Hệ thống Nước' },
  { id: 8, maKKS: 'PAB20', tenThietBi: 'Bơm nước cấp #2', heThong: 'Hệ thống Nước' },
  { id: 9, maKKS: 'HLA10', tenThietBi: 'Quạt gió #1', heThong: 'Hệ thống Khí' },
  { id: 10, maKKS: 'HNA10', tenThietBi: 'Bộ khử bụi tĩnh điện', heThong: 'Hệ thống Xử lý khí thải' },
];

export const equipmentService = {
  /**
   * Lấy danh sách thiết bị
   */
  getAll: () => {
    // TODO: return axios.get(API_URL);
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data: MOCK_EQUIPMENT }), 300);
    });
  },

  /**
   * Lấy thiết bị theo ID
   */
  getById: (id) => {
    // TODO: return axios.get(`${API_URL}/${id}`);
    return new Promise((resolve, reject) => {
      const item = MOCK_EQUIPMENT.find((e) => e.id === id);
      setTimeout(() => {
        item
          ? resolve({ data: item })
          : reject({ response: { status: 404, data: { message: 'Không tìm thấy thiết bị' } } });
      }, 200);
    });
  },
};
