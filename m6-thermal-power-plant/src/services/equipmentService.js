import apiClient from './apiClient';

const API_URL = '/api/v1/equipment';

/**
 * Mock danh sách thiết bị — dùng cho dropdown tạo yêu cầu sửa chữa
 */
const MOCK_EQUIPMENT = [
  { id: 1, kksCode: 'MAA10', equipmentName: 'Lò hơi #1', systemName: 'Hệ thống Lò hơi' },
  { id: 2, kksCode: 'MAA20', equipmentName: 'Lò hơi #2', systemName: 'Hệ thống Lò hơi' },
  { id: 3, kksCode: 'MAG10', equipmentName: 'Tua-bin hơi #1', systemName: 'Hệ thống Tua-bin' },
  { id: 4, kksCode: 'MAG20', equipmentName: 'Tua-bin hơi #2', systemName: 'Hệ thống Tua-bin' },
  { id: 5, kksCode: 'MKA10', equipmentName: 'Máy phát điện #1', systemName: 'Hệ thống Phát điện' },
  { id: 6, kksCode: 'MKA20', equipmentName: 'Máy phát điện #2', systemName: 'Hệ thống Phát điện' },
  { id: 7, kksCode: 'PAB10', equipmentName: 'Bơm nước cấp #1', systemName: 'Hệ thống Nước' },
  { id: 8, kksCode: 'PAB20', equipmentName: 'Bơm nước cấp #2', systemName: 'Hệ thống Nước' },
  { id: 9, kksCode: 'HLA10', equipmentName: 'Quạt gió #1', systemName: 'Hệ thống Khí' },
  { id: 10, kksCode: 'HNA10', equipmentName: 'Bộ khử bụi tĩnh điện', systemName: 'Hệ thống Xử lý khí thải' },
];

export const equipmentService = {
  /**
   * Lấy danh sách thiết bị
   */
  getAll: () => {
    // TODO: return apiClient.get(API_URL);
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data: MOCK_EQUIPMENT }), 300);
    });
  },

  /**
   * Lấy thiết bị theo ID
   */
  getById: (id) => {
    // TODO: return apiClient.get(`${API_URL}/${id}`);
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
