import axios from 'axios';
import { authService } from './authService';

const API_URL = '/api/phieu-yeu-cau';

/**
 * Trạng thái yêu cầu sửa chữa
 */
export const REQUEST_STATUS = {
  CHO_DUYET: 'CHO_DUYET',
  DA_DUYET: 'DA_DUYET',
  DANG_XU_LY: 'DANG_XU_LY',
  HOAN_THANH: 'HOAN_THANH',
  TU_CHOI: 'TU_CHOI',
};

export const REQUEST_STATUS_LABEL = {
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  DANG_XU_LY: 'Đang xử lý',
  HOAN_THANH: 'Hoàn thành',
  TU_CHOI: 'Từ chối',
};

export const REQUEST_STATUS_VARIANT = {
  CHO_DUYET: 'warning',
  DA_DUYET: 'info',
  DANG_XU_LY: 'info',
  HOAN_THANH: 'normal',
  TU_CHOI: 'danger',
};

/**
 * Mức độ ưu tiên
 */
export const PRIORITY = {
  THAP: 'THAP',
  TRUNG_BINH: 'TRUNG_BINH',
  CAO: 'CAO',
  KHAN_CAP: 'KHAN_CAP',
};

export const PRIORITY_LABEL = {
  THAP: 'Thấp',
  TRUNG_BINH: 'Trung bình',
  CAO: 'Cao',
  KHAN_CAP: 'Khẩn cấp',
};

export const PRIORITY_COLOR = {
  THAP: 'var(--color-status-inactive)',
  TRUNG_BINH: 'var(--color-status-info)',
  CAO: 'var(--color-status-warning)',
  KHAN_CAP: 'var(--color-status-danger)',
};

/**
 * Mock data — 8 yêu cầu sửa chữa
 */
let mockRequests = [
  {
    id: 1,
    kksCode: 'MAA10',
    equipmentName: 'Lò hơi #1',
    issueDescription: 'Rò rỉ đường ống hơi chính tại mặt bích tầng 3, áp lực giảm 0.2 MPa',
    priority: 'KHAN_CAP',
    status: 'DANG_XU_LY',
    createdBy: 'Trần Minh Trưởng Ca',
    createdAt: '2026-06-20T08:30:00',
    equipmentId: 1,
  },
  {
    id: 2,
    kksCode: 'MAG10',
    equipmentName: 'Tua-bin hơi #1',
    issueDescription: 'Rung động bất thường tại ổ trục số 3, biên độ vượt ngưỡng cảnh báo',
    priority: 'CAO',
    status: 'DA_DUYET',
    createdBy: 'Trần Minh Trưởng Ca',
    createdAt: '2026-06-21T10:15:00',
    equipmentId: 3,
  },
  {
    id: 3,
    kksCode: 'PAB10',
    equipmentName: 'Bơm nước cấp #1',
    issueDescription: 'Phớt bơm bị mòn, nước rò rỉ ra ngoài khoảng 5 lít/phút',
    priority: 'TRUNG_BINH',
    status: 'CHO_DUYET',
    createdBy: 'Trần Minh Trưởng Ca',
    createdAt: '2026-06-22T14:00:00',
    equipmentId: 7,
  },
  {
    id: 4,
    kksCode: 'HLA10',
    equipmentName: 'Quạt gió #1',
    issueDescription: 'Cánh quạt bị nứt, cần thay thế trong lần bảo dưỡng tới',
    priority: 'THAP',
    status: 'HOAN_THANH',
    createdBy: 'Trần Minh Trưởng Ca',
    createdAt: '2026-06-15T09:00:00',
    equipmentId: 9,
  },
  {
    id: 5,
    kksCode: 'MKA10',
    equipmentName: 'Máy phát điện #1',
    issueDescription: 'Nhiệt độ cuộn dây stator tăng cao bất thường, cần kiểm tra hệ thống làm mát',
    priority: 'CAO',
    status: 'CHO_DUYET',
    createdBy: 'Trần Minh Trưởng Ca',
    createdAt: '2026-06-23T07:45:00',
    equipmentId: 5,
  },
  {
    id: 6,
    kksCode: 'MAA20',
    equipmentName: 'Lò hơi #2',
    issueDescription: 'Van an toàn hoạt động không chính xác, cần hiệu chuẩn lại',
    priority: 'KHAN_CAP',
    status: 'DA_DUYET',
    createdBy: 'Trần Minh Trưởng Ca',
    createdAt: '2026-06-22T16:30:00',
    equipmentId: 2,
  },
  {
    id: 7,
    kksCode: 'HNA10',
    equipmentName: 'Bộ khử bụi tĩnh điện',
    issueDescription: 'Hiệu suất lọc bụi giảm xuống dưới 95%, cần vệ sinh tấm cực',
    priority: 'TRUNG_BINH',
    status: 'CHO_DUYET',
    createdBy: 'Trần Minh Trưởng Ca',
    createdAt: '2026-06-23T11:00:00',
    equipmentId: 10,
  },
  {
    id: 8,
    kksCode: 'PAB20',
    equipmentName: 'Bơm nước cấp #2',
    issueDescription: 'Tiếng ồn lạ phát ra từ hộp số, nghi ngờ hư hỏng bánh răng',
    priority: 'CAO',
    status: 'DANG_XU_LY',
    createdBy: 'Trần Minh Trưởng Ca',
    createdAt: '2026-06-19T13:20:00',
    equipmentId: 8,
  },
];

let nextId = 9;

export const repairRequestService = {
  /**
   * Lấy danh sách tất cả yêu cầu sửa chữa
   */
  getAll: () => {
    // TODO: return axios.get(API_URL);
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data: [...mockRequests] }), 400);
    });
  },

  /**
   * Lấy yêu cầu theo ID
   */
  getById: (id) => {
    // TODO: return axios.get(`${API_URL}/${id}`);
    return new Promise((resolve, reject) => {
      const item = mockRequests.find((r) => r.id === Number(id));
      setTimeout(() => {
        item
          ? resolve({ data: { ...item } })
          : reject({ response: { status: 404, data: { message: 'Không tìm thấy yêu cầu' } } });
      }, 300);
    });
  },

  /**
   * Tạo yêu cầu sửa chữa mới
   * @param {{ equipmentId: number, issueDescription: string, priority: string }} dto
   */
  create: (dto) => {
    // TODO: return axios.post(API_URL, dto);
    return new Promise((resolve) => {
      const equipment = [
        { id: 1, kksCode: 'MAA10', ten: 'Lò hơi #1' },
        { id: 2, kksCode: 'MAA20', ten: 'Lò hơi #2' },
        { id: 3, kksCode: 'MAG10', ten: 'Tua-bin hơi #1' },
        { id: 4, kksCode: 'MAG20', ten: 'Tua-bin hơi #2' },
        { id: 5, kksCode: 'MKA10', ten: 'Máy phát điện #1' },
        { id: 6, kksCode: 'MKA20', ten: 'Máy phát điện #2' },
        { id: 7, kksCode: 'PAB10', ten: 'Bơm nước cấp #1' },
        { id: 8, kksCode: 'PAB20', ten: 'Bơm nước cấp #2' },
        { id: 9, kksCode: 'HLA10', ten: 'Quạt gió #1' },
        { id: 10, kksCode: 'HNA10', ten: 'Bộ khử bụi tĩnh điện' },
      ];
      const eq = equipment.find((e) => e.id === Number(dto.equipmentId));

      const newRequest = {
        id: nextId++,
        kksCode: eq?.kksCode || 'N/A',
        equipmentName: eq?.ten || 'Không xác định',
        issueDescription: dto.issueDescription,
        priority: dto.priority,
        status: REQUEST_STATUS.CHO_DUYET,
        createdBy: authService.getCurrentUser()?.fullName || 'Trần Minh Trưởng Ca',
        createdAt: new Date().toISOString(),
        equipmentId: Number(dto.equipmentId),
      };
      mockRequests = [newRequest, ...mockRequests];
      setTimeout(() => resolve({ data: newRequest }), 500);
    });
  },

  /**
   * Cập nhật yêu cầu (chỉ khi CHO_DUYET, bởi người tạo)
   * @param {number} id
   * @param {{ issueDescription?: string, priority?: string }} dto
   */
  update: (id, dto) => {
    return new Promise((resolve, reject) => {
      const idx = mockRequests.findIndex((r) => r.id === Number(id));
      setTimeout(() => {
        if (idx === -1) {
          reject({ response: { status: 404, data: { message: 'Không tìm thấy yêu cầu' } } });
          return;
        }
        if (mockRequests[idx].status !== REQUEST_STATUS.CHO_DUYET) {
          reject({ response: { status: 400, data: { message: 'Chỉ sửa được yêu cầu đang chờ duyệt' } } });
          return;
        }
        mockRequests[idx] = { ...mockRequests[idx], ...dto };
        resolve({ data: { ...mockRequests[idx] } });
      }, 400);
    });
  },

  /**
   * Duyệt yêu cầu (CHO_DUYET → DA_DUYET)
   */
  approve: (id) => {
    return new Promise((resolve, reject) => {
      const idx = mockRequests.findIndex((r) => r.id === Number(id));
      setTimeout(() => {
        if (idx === -1) {
          reject({ response: { status: 404, data: { message: 'Không tìm thấy yêu cầu' } } });
          return;
        }
        if (mockRequests[idx].status !== REQUEST_STATUS.CHO_DUYET) {
          reject({ response: { status: 400, data: { message: 'Chỉ duyệt được yêu cầu đang chờ duyệt' } } });
          return;
        }
        mockRequests[idx].status = REQUEST_STATUS.DA_DUYET;
        resolve({ data: { ...mockRequests[idx] } });
      }, 400);
    });
  },

  /**
   * Từ chối yêu cầu (CHO_DUYET → TU_CHOI)
   */
  reject: (id) => {
    return new Promise((resolve, reject) => {
      const idx = mockRequests.findIndex((r) => r.id === Number(id));
      setTimeout(() => {
        if (idx === -1) {
          reject({ response: { status: 404, data: { message: 'Không tìm thấy yêu cầu' } } });
          return;
        }
        if (mockRequests[idx].status !== REQUEST_STATUS.CHO_DUYET) {
          reject({ response: { status: 400, data: { message: 'Chỉ từ chối được yêu cầu đang chờ duyệt' } } });
          return;
        }
        mockRequests[idx].status = REQUEST_STATUS.TU_CHOI;
        resolve({ data: { ...mockRequests[idx] } });
      }, 400);
    });
  },

  /**
   * Chuyển yêu cầu sang "Đang xử lý" (DA_DUYET → DANG_XU_LY).
   * Gọi sau khi tạo PCT thành công từ yêu cầu đã được duyệt.
   */
  markAsProcessing: (id) => {
    return new Promise((resolve, reject) => {
      const idx = mockRequests.findIndex((r) => r.id === Number(id));
      setTimeout(() => {
        if (idx === -1) {
          reject({ response: { status: 404, data: { message: 'Không tìm thấy yêu cầu' } } });
          return;
        }
        if (mockRequests[idx].status !== REQUEST_STATUS.DA_DUYET) {
          reject({ response: { status: 400, data: { message: 'Chỉ chuyển trạng thái cho yêu cầu đã duyệt' } } });
          return;
        }
        mockRequests[idx].status = REQUEST_STATUS.DANG_XU_LY;
        resolve({ data: { ...mockRequests[idx] } });
      }, 300);
    });
  },

  /**
   * Xoá yêu cầu (chỉ khi trạng thái CHO_DUYET)
   */
  remove: (id) => {
    // TODO: return axios.delete(`${API_URL}/${id}`);
    return new Promise((resolve, reject) => {
      const idx = mockRequests.findIndex((r) => r.id === Number(id));
      setTimeout(() => {
        if (idx === -1) {
          reject({ response: { status: 404, data: { message: 'Không tìm thấy yêu cầu' } } });
          return;
        }
        if (mockRequests[idx].status !== REQUEST_STATUS.CHO_DUYET) {
          reject({ response: { status: 400, data: { message: 'Chỉ được xoá yêu cầu đang chờ duyệt' } } });
          return;
        }
        mockRequests = mockRequests.filter((r) => r.id !== Number(id));
        resolve({ data: { message: 'Xoá thành công' } });
      }, 400);
    });
  },
};
