import apiClient from './apiClient';

/**
 * Trạng thái yêu cầu sửa chữa — khớp Backend enum RepairRequestStatus
 */
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

export const REQUEST_STATUS_LABEL = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
};

export const REQUEST_STATUS_VARIANT = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'normal',
};

/**
 * Mức độ ưu tiên — khớp Backend enum RepairPriority (HIGH, LOW, NORMAL, EMERGENCY)
 */
export const PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  EMERGENCY: 'EMERGENCY',
};

export const PRIORITY_LABEL = {
  LOW: 'Thấp',
  NORMAL: 'Trung bình',
  HIGH: 'Cao',
  EMERGENCY: 'Khẩn cấp',
};

export const PRIORITY_COLOR = {
  LOW: 'var(--color-status-inactive)',
  NORMAL: 'var(--color-status-info)',
  HIGH: 'var(--color-status-warning)',
  EMERGENCY: 'var(--color-status-danger)',
};

export const repairRequestService = {
  /**
   * Lấy danh sách tất cả yêu cầu sửa chữa (phân trang)
   */
  getAll: async () => {
    return apiClient.get('/api/v1/repair-requests?page=0&size=100');
  },

  /**
   * Tạo yêu cầu sửa chữa mới
   * @param {{ equipmentId: number, issueDescription: string, priority: string }} dto
   */
  create: async (dto) => {
    return apiClient.post('/api/v1/repair-requests', {
      equipmentId: Number(dto.equipmentId),
      incidentDescription: dto.issueDescription,
      priority: dto.priority,
    });
  },

  /**
   * Xoá yêu cầu (soft delete)
   */
  remove: async (id) => {
    return apiClient.delete(`/api/v1/repair-requests/${id}`);
  },
};
