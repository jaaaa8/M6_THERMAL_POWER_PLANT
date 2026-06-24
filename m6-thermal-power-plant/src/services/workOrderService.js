import axios from 'axios';

const API_URL = '/api/phieu-cong-tac';

/**
 * Trạng thái phiếu công tác
 */
export const WORK_ORDER_STATUS = {
  CHUA_MO: 'CHUA_MO',
  DANG_THUC_HIEN: 'DANG_THUC_HIEN',
  TAM_DUNG: 'TAM_DUNG',
  NGHIEM_THU: 'NGHIEM_THU',
};

export const WO_STATUS_LABEL = {
  CHUA_MO: 'Chưa mở',
  DANG_THUC_HIEN: 'Đang thực hiện',
  TAM_DUNG: 'Tạm dừng',
  NGHIEM_THU: 'Đã nghiệm thu',
};

export const WO_STATUS_VARIANT = {
  CHUA_MO: 'inactive',
  DANG_THUC_HIEN: 'info',
  TAM_DUNG: 'warning',
  NGHIEM_THU: 'normal',
};

/**
 * Mock data phiếu công tác
 */
let mockWorkOrders = [
  {
    id: 1,
    maPhieu: 'PCT-2026-001',
    yeuCauId: 1,
    maKKS: 'MAA10',
    tenThietBi: 'Lò hơi #1',
    moTaCongViec: 'Sửa chữa rò rỉ đường ống hơi chính tại mặt bích tầng 3',
    nguoiChiHuy: 'Lê Văn Quản Đốc',
    nguoiGiamSat: 'Phạm Thị An Toàn',
    toTruong: 'Nguyễn Văn Tổ Trưởng',
    trangThai: 'CHUA_MO',
    ngayTao: '2026-06-20T09:00:00',
    ngayBatDau: null,
    ngayKetThuc: null,
    danhSachThanhVien: [
      { id: 1, hoTen: 'Nguyễn Văn A', chucVu: 'Thợ hàn' },
      { id: 2, hoTen: 'Trần Văn B', chucVu: 'Thợ ống' },
      { id: 3, hoTen: 'Lê Văn C', chucVu: 'Thợ điện' },
    ],
    nhatKy: [
      {
        id: 1,
        thoiGian: '2026-06-20T09:00:00',
        hanhDong: 'Tạo phiếu công tác',
        nguoiThucHien: 'Lê Văn Quản Đốc',
        ghiChu: 'Phiếu được tạo từ yêu cầu sửa chữa #1',
      },
    ],
  },
  {
    id: 2,
    maPhieu: 'PCT-2026-002',
    yeuCauId: 8,
    maKKS: 'PAB20',
    tenThietBi: 'Bơm nước cấp #2',
    moTaCongViec: 'Kiểm tra và thay thế bánh răng hộp số bơm nước cấp #2',
    nguoiChiHuy: 'Lê Văn Quản Đốc',
    nguoiGiamSat: 'Phạm Thị An Toàn',
    toTruong: 'Nguyễn Văn Tổ Trưởng',
    trangThai: 'DANG_THUC_HIEN',
    ngayTao: '2026-06-19T14:00:00',
    ngayBatDau: '2026-06-19T14:30:00',
    ngayKetThuc: null,
    danhSachThanhVien: [
      { id: 4, hoTen: 'Phạm Văn D', chucVu: 'Thợ cơ khí' },
      { id: 5, hoTen: 'Hoàng Văn E', chucVu: 'Thợ cơ khí' },
    ],
    nhatKy: [
      {
        id: 1,
        thoiGian: '2026-06-19T14:00:00',
        hanhDong: 'Tạo phiếu công tác',
        nguoiThucHien: 'Lê Văn Quản Đốc',
        ghiChu: 'Phiếu được tạo từ yêu cầu sửa chữa #8',
      },
      {
        id: 2,
        thoiGian: '2026-06-19T14:30:00',
        hanhDong: 'Mở phiếu công tác',
        nguoiThucHien: 'Lê Văn Quản Đốc',
        ghiChu: 'Bắt đầu công việc sửa chữa',
      },
    ],
  },
  {
    id: 3,
    maPhieu: 'PCT-2026-003',
    yeuCauId: 4,
    maKKS: 'HLA10',
    tenThietBi: 'Quạt gió #1',
    moTaCongViec: 'Thay thế cánh quạt bị nứt và cân bằng động',
    nguoiChiHuy: 'Lê Văn Quản Đốc',
    nguoiGiamSat: 'Phạm Thị An Toàn',
    toTruong: 'Nguyễn Văn Tổ Trưởng',
    trangThai: 'TAM_DUNG',
    ngayTao: '2026-06-15T10:00:00',
    ngayBatDau: '2026-06-15T10:30:00',
    ngayKetThuc: null,
    danhSachThanhVien: [
      { id: 6, hoTen: 'Vũ Văn F', chucVu: 'Thợ cơ khí' },
      { id: 7, hoTen: 'Đỗ Văn G', chucVu: 'Thợ hàn' },
    ],
    nhatKy: [
      {
        id: 1,
        thoiGian: '2026-06-15T10:00:00',
        hanhDong: 'Tạo phiếu công tác',
        nguoiThucHien: 'Lê Văn Quản Đốc',
        ghiChu: 'Phiếu được tạo từ yêu cầu sửa chữa #4',
      },
      {
        id: 2,
        thoiGian: '2026-06-15T10:30:00',
        hanhDong: 'Mở phiếu công tác',
        nguoiThucHien: 'Lê Văn Quản Đốc',
        ghiChu: 'Bắt đầu thi công',
      },
      {
        id: 3,
        thoiGian: '2026-06-16T17:00:00',
        hanhDong: 'Đóng phiếu công tác',
        nguoiThucHien: 'Lê Văn Quản Đốc',
        ghiChu: 'Tạm dừng cuối ngày, chờ vật tư thay thế',
      },
    ],
  },
];

let nextLogId = 10;

export const workOrderService = {
  /**
   * Lấy danh sách tất cả phiếu công tác
   */
  getAll: () => {
    // TODO: return axios.get(API_URL);
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data: [...mockWorkOrders] }), 400);
    });
  },

  /**
   * Lấy phiếu công tác theo ID
   */
  getById: (id) => {
    // TODO: return axios.get(`${API_URL}/${id}`);
    return new Promise((resolve, reject) => {
      const item = mockWorkOrders.find((wo) => wo.id === Number(id));
      setTimeout(() => {
        if (item) {
          resolve({ data: JSON.parse(JSON.stringify(item)) });
        } else {
          reject({ response: { status: 404, data: { message: 'Không tìm thấy phiếu công tác' } } });
        }
      }, 300);
    });
  },

  /**
   * Cập nhật trạng thái phiếu công tác
   * @param {number} id
   * @param {string} newStatus - DANG_THUC_HIEN | TAM_DUNG | NGHIEM_THU
   * @param {string} ghiChu - Ghi chú khi thay đổi trạng thái
   */
  updateStatus: (id, newStatus, ghiChu = '') => {
    // TODO: return axios.patch(`${API_URL}/${id}/status`, { status: newStatus, ghiChu });
    return new Promise((resolve, reject) => {
      const idx = mockWorkOrders.findIndex((wo) => wo.id === Number(id));
      setTimeout(() => {
        if (idx === -1) {
          reject({ response: { status: 404, data: { message: 'Không tìm thấy phiếu công tác' } } });
          return;
        }

        const wo = mockWorkOrders[idx];
        const actionLabels = {
          DANG_THUC_HIEN: 'Mở phiếu công tác',
          TAM_DUNG: 'Đóng phiếu công tác',
          NGHIEM_THU: 'Khóa phiếu / Nghiệm thu',
        };

        // Validate transition
        const validTransitions = {
          CHUA_MO: ['DANG_THUC_HIEN'],
          DANG_THUC_HIEN: ['TAM_DUNG'],
          TAM_DUNG: ['DANG_THUC_HIEN', 'NGHIEM_THU'],
        };

        if (!validTransitions[wo.trangThai]?.includes(newStatus)) {
          reject({
            response: {
              status: 400,
              data: { message: `Không thể chuyển từ "${WO_STATUS_LABEL[wo.trangThai]}" sang "${WO_STATUS_LABEL[newStatus]}"` },
            },
          });
          return;
        }

        wo.trangThai = newStatus;
        if (newStatus === 'DANG_THUC_HIEN' && !wo.ngayBatDau) {
          wo.ngayBatDau = new Date().toISOString();
        }
        if (newStatus === 'NGHIEM_THU') {
          wo.ngayKetThuc = new Date().toISOString();
        }

        wo.nhatKy.push({
          id: nextLogId++,
          thoiGian: new Date().toISOString(),
          hanhDong: actionLabels[newStatus] || newStatus,
          nguoiThucHien: 'Người dùng hiện tại',
          ghiChu: ghiChu || `Chuyển trạng thái sang ${WO_STATUS_LABEL[newStatus]}`,
        });

        resolve({ data: JSON.parse(JSON.stringify(wo)) });
      }, 500);
    });
  },
};
