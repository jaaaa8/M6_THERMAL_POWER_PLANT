import apiClient from './apiClient';

/**
 * Trạng thái yêu cầu sửa chữa — khớp Backend enum RepairRequestStatus
 */
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

export const REQUEST_STATUS_LABEL = {
  PENDING: 'Chờ xử lý',
  APPROVED: 'Đã duyệt',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
};

export const REQUEST_STATUS_VARIANT = {
  PENDING: 'warning',    // vàng
  APPROVED: 'accent',    // cobalt
  IN_PROGRESS: 'info',   // xanh dương
  COMPLETED: 'normal',   // xanh lá
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
   * Lấy danh sách yêu cầu sửa chữa — phân trang + lọc SERVER-SIDE.
   * @param {{ status?: string, priority?: string, search?: string, page?: number, size?: number }} params
   * axios tự loại param undefined/'' nên có thể truyền thiếu tuỳ ý.
   */
  getList: async ({ status, priority, search, page = 0, size = 10 } = {}) => {
    return apiClient.get('/api/v1/repair-requests', {
      params: {
        status: status || undefined,
        priority: priority || undefined,
        search: search?.trim() || undefined,
        page,
        size,
        sort: 'createdAt,desc',
      },
    });
  },

  /**
   * Số liệu tổng hợp (đếm trên toàn bộ) cho stat cards + pill counts.
   */
  getStats: async () => {
    return apiClient.get('/api/v1/repair-requests/stats');
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
