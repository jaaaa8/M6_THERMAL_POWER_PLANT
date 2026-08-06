import apiClient from './apiClient';

/**
 * Trạng thái yêu cầu sửa chữa — khớp Backend enum RepairRequestStatus.
 * PYC chỉ để tạo Phiếu công tác, nên chỉ có 2 chặng: chờ xử lý → đã đóng.
 */
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
};

export const REQUEST_STATUS_LABEL = {
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Đã đóng',   // đã có PCT — KHÔNG mang nghĩa "đã sửa xong"
};

export const REQUEST_STATUS_VARIANT = {
  PENDING: 'warning',    // vàng
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
        // Spring hiểu "a,b,dir" = sort cả 2 cột theo dir. status lưu dạng chuỗi
        // nên 'PENDING' > 'COMPLETED' => Chờ xử lý lên đầu, trong mỗi nhóm thì
        // mới nhất trước.
        // ponytail: mẹo này chỉ đúng khi enum còn ĐÚNG 2 giá trị và P > C theo
        // alphabet. Thêm trạng thái thứ 3 thì phải đổi sang ORDER BY CASE trong
        // @Query của RepairRequestRepository.search.
        // KHÔNG truyền mảng sort: [...] — apiClient không set paramsSerializer,
        // axios sẽ phát ra "sort[]=" mà Spring không bind được.
        sort: 'status,createdAt,desc',
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
