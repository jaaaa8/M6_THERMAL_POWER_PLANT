import axios from 'axios';

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
    maKKS: 'MAA10',
    tenThietBi: 'Lò hơi #1',
    moTaSuCo: 'Rò rỉ đường ống hơi chính tại mặt bích tầng 3, áp lực giảm 0.2 MPa',
    mucDoUuTien: 'KHAN_CAP',
    trangThai: 'DANG_XU_LY',
    nguoiTao: 'Trần Minh Trưởng Ca',
    ngayTao: '2026-06-20T08:30:00',
    thietBiId: 1,
  },
  {
    id: 2,
    maKKS: 'MAG10',
    tenThietBi: 'Tua-bin hơi #1',
    moTaSuCo: 'Rung động bất thường tại ổ trục số 3, biên độ vượt ngưỡng cảnh báo',
    mucDoUuTien: 'CAO',
    trangThai: 'DA_DUYET',
    nguoiTao: 'Trần Minh Trưởng Ca',
    ngayTao: '2026-06-21T10:15:00',
    thietBiId: 3,
  },
  {
    id: 3,
    maKKS: 'PAB10',
    tenThietBi: 'Bơm nước cấp #1',
    moTaSuCo: 'Phớt bơm bị mòn, nước rò rỉ ra ngoài khoảng 5 lít/phút',
    mucDoUuTien: 'TRUNG_BINH',
    trangThai: 'CHO_DUYET',
    nguoiTao: 'Trần Minh Trưởng Ca',
    ngayTao: '2026-06-22T14:00:00',
    thietBiId: 7,
  },
  {
    id: 4,
    maKKS: 'HLA10',
    tenThietBi: 'Quạt gió #1',
    moTaSuCo: 'Cánh quạt bị nứt, cần thay thế trong lần bảo dưỡng tới',
    mucDoUuTien: 'THAP',
    trangThai: 'HOAN_THANH',
    nguoiTao: 'Trần Minh Trưởng Ca',
    ngayTao: '2026-06-15T09:00:00',
    thietBiId: 9,
  },
  {
    id: 5,
    maKKS: 'MKA10',
    tenThietBi: 'Máy phát điện #1',
    moTaSuCo: 'Nhiệt độ cuộn dây stator tăng cao bất thường, cần kiểm tra hệ thống làm mát',
    mucDoUuTien: 'CAO',
    trangThai: 'CHO_DUYET',
    nguoiTao: 'Trần Minh Trưởng Ca',
    ngayTao: '2026-06-23T07:45:00',
    thietBiId: 5,
  },
  {
    id: 6,
    maKKS: 'MAA20',
    tenThietBi: 'Lò hơi #2',
    moTaSuCo: 'Van an toàn hoạt động không chính xác, cần hiệu chuẩn lại',
    mucDoUuTien: 'KHAN_CAP',
    trangThai: 'DA_DUYET',
    nguoiTao: 'Trần Minh Trưởng Ca',
    ngayTao: '2026-06-22T16:30:00',
    thietBiId: 2,
  },
  {
    id: 7,
    maKKS: 'HNA10',
    tenThietBi: 'Bộ khử bụi tĩnh điện',
    moTaSuCo: 'Hiệu suất lọc bụi giảm xuống dưới 95%, cần vệ sinh tấm cực',
    mucDoUuTien: 'TRUNG_BINH',
    trangThai: 'CHO_DUYET',
    nguoiTao: 'Trần Minh Trưởng Ca',
    ngayTao: '2026-06-23T11:00:00',
    thietBiId: 10,
  },
  {
    id: 8,
    maKKS: 'PAB20',
    tenThietBi: 'Bơm nước cấp #2',
    moTaSuCo: 'Tiếng ồn lạ phát ra từ hộp số, nghi ngờ hư hỏng bánh răng',
    mucDoUuTien: 'CAO',
    trangThai: 'DANG_XU_LY',
    nguoiTao: 'Trần Minh Trưởng Ca',
    ngayTao: '2026-06-19T13:20:00',
    thietBiId: 8,
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
   * @param {{ thietBiId: number, moTaSuCo: string, mucDoUuTien: string }} dto
   */
  create: (dto) => {
    // TODO: return axios.post(API_URL, dto);
    return new Promise((resolve) => {
      const equipment = [
        { id: 1, maKKS: 'MAA10', ten: 'Lò hơi #1' },
        { id: 2, maKKS: 'MAA20', ten: 'Lò hơi #2' },
        { id: 3, maKKS: 'MAG10', ten: 'Tua-bin hơi #1' },
        { id: 4, maKKS: 'MAG20', ten: 'Tua-bin hơi #2' },
        { id: 5, maKKS: 'MKA10', ten: 'Máy phát điện #1' },
        { id: 6, maKKS: 'MKA20', ten: 'Máy phát điện #2' },
        { id: 7, maKKS: 'PAB10', ten: 'Bơm nước cấp #1' },
        { id: 8, maKKS: 'PAB20', ten: 'Bơm nước cấp #2' },
        { id: 9, maKKS: 'HLA10', ten: 'Quạt gió #1' },
        { id: 10, maKKS: 'HNA10', ten: 'Bộ khử bụi tĩnh điện' },
      ];
      const eq = equipment.find((e) => e.id === Number(dto.thietBiId));

      const newRequest = {
        id: nextId++,
        maKKS: eq?.maKKS || 'N/A',
        tenThietBi: eq?.ten || 'Không xác định',
        moTaSuCo: dto.moTaSuCo,
        mucDoUuTien: dto.mucDoUuTien,
        trangThai: REQUEST_STATUS.CHO_DUYET,
        nguoiTao: 'Trần Minh Trưởng Ca',
        ngayTao: new Date().toISOString(),
        thietBiId: Number(dto.thietBiId),
      };
      mockRequests = [newRequest, ...mockRequests];
      setTimeout(() => resolve({ data: newRequest }), 500);
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
        if (mockRequests[idx].trangThai !== REQUEST_STATUS.CHO_DUYET) {
          reject({ response: { status: 400, data: { message: 'Chỉ được xoá yêu cầu đang chờ duyệt' } } });
          return;
        }
        mockRequests = mockRequests.filter((r) => r.id !== Number(id));
        resolve({ data: { message: 'Xoá thành công' } });
      }, 400);
    });
  },
};
