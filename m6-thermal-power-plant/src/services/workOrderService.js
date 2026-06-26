import axios from 'axios';
import { authService } from './authService';

const API_URL = '/api/phieu-cong-tac';

/**
 * Trạng thái phiếu công tác (theo chu kỳ làm việc nhiều ngày).
 * - CHUA_MO : Chưa từng mở phiên nào.
 * - DANG_MO : Có một phiên đang mở (đang làm việc trong ngày).
 * - TAM_DONG: Đã đóng phiên trong ngày, chờ mở lại ngày tiếp theo hoặc chờ khóa.
 * - DA_KHOA : Đã hoàn thành & khóa phiếu — không thao tác được nữa.
 */
export const WORK_ORDER_STATUS = {
  CHUA_MO: 'CHUA_MO',
  DANG_MO: 'DANG_MO',
  TAM_DONG: 'TAM_DONG',
  DA_KHOA: 'DA_KHOA',
};

export const WO_STATUS_LABEL = {
  CHUA_MO: 'Chưa mở',
  DANG_MO: 'Đang mở',
  TAM_DONG: 'Tạm đóng',
  DA_KHOA: 'Đã khóa',
};

export const WO_STATUS_VARIANT = {
  CHUA_MO: 'inactive',
  DANG_MO: 'info',
  TAM_DONG: 'warning',
  DA_KHOA: 'normal',
};

/**
 * Pool nhân sự thi công có thể thêm vào phiếu (mock).
 */
export const AVAILABLE_WORKERS = [
  { id: 101, hoTen: 'Nguyễn Văn A', chucVu: 'Thợ hàn' },
  { id: 102, hoTen: 'Trần Văn B', chucVu: 'Thợ ống' },
  { id: 103, hoTen: 'Lê Văn C', chucVu: 'Thợ điện' },
  { id: 104, hoTen: 'Phạm Văn D', chucVu: 'Thợ cơ khí' },
  { id: 105, hoTen: 'Hoàng Văn E', chucVu: 'Thợ cơ khí' },
  { id: 106, hoTen: 'Vũ Văn F', chucVu: 'Thợ cơ khí' },
  { id: 107, hoTen: 'Đỗ Văn G', chucVu: 'Thợ hàn' },
  { id: 108, hoTen: 'Bùi Văn H', chucVu: 'Thợ điện' },
  { id: 109, hoTen: 'Đặng Văn I', chucVu: 'Thợ ống' },
  { id: 110, hoTen: 'Ngô Văn K', chucVu: 'Phụ việc' },
];

/**
 * Mock data phiếu công tác.
 * Mỗi phiếu gồm nhiều `phienLamViec` (phiên theo ngày). Mỗi phiên ghi nhận
 * thời điểm mở/đóng và danh sách thành viên thi công kèm giờ vào / giờ ra.
 * 3 vai trò quản lý (chỉ huy, giám sát, tổ trưởng) cố định ở cấp phiếu.
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
    phienLamViec: [],
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
    trangThai: 'DANG_MO',
    ngayTao: '2026-06-19T14:00:00',
    phienLamViec: [
      {
        id: 1,
        ngay: '2026-06-19',
        gioMo: '2026-06-19T07:30:00',
        gioDong: '2026-06-19T16:30:00',
        nguoiMo: 'Trần Minh Trưởng Ca',
        nguoiDong: 'Trần Minh Trưởng Ca',
        thanhVien: [
          { id: 1, hoTen: 'Phạm Văn D', chucVu: 'Thợ cơ khí', gioVao: '2026-06-19T07:30:00', gioRa: '2026-06-19T16:30:00' },
          { id: 2, hoTen: 'Hoàng Văn E', chucVu: 'Thợ cơ khí', gioVao: '2026-06-19T07:30:00', gioRa: '2026-06-19T16:30:00' },
        ],
      },
      {
        id: 2,
        ngay: '2026-06-20',
        gioMo: '2026-06-20T07:30:00',
        gioDong: null,
        nguoiMo: 'Trần Minh Trưởng Ca',
        nguoiDong: null,
        thanhVien: [
          { id: 3, hoTen: 'Phạm Văn D', chucVu: 'Thợ cơ khí', gioVao: '2026-06-20T07:30:00', gioRa: null },
          { id: 4, hoTen: 'Vũ Văn F', chucVu: 'Thợ cơ khí', gioVao: '2026-06-20T08:00:00', gioRa: null },
        ],
      },
    ],
    nhatKy: [
      { id: 1, thoiGian: '2026-06-19T14:00:00', hanhDong: 'Tạo phiếu công tác', nguoiThucHien: 'Lê Văn Quản Đốc', ghiChu: 'Phiếu được tạo từ yêu cầu sửa chữa #8' },
      { id: 2, thoiGian: '2026-06-19T07:30:00', hanhDong: 'Mở phiếu (ngày 19/06)', nguoiThucHien: 'Trần Minh Trưởng Ca', ghiChu: 'Bắt đầu ca làm việc' },
      { id: 3, thoiGian: '2026-06-19T16:30:00', hanhDong: 'Đóng phiếu (ngày 19/06)', nguoiThucHien: 'Trần Minh Trưởng Ca', ghiChu: 'Kết thúc ca, chờ tiếp tục ngày mai' },
      { id: 4, thoiGian: '2026-06-20T07:30:00', hanhDong: 'Mở phiếu (ngày 20/06)', nguoiThucHien: 'Trần Minh Trưởng Ca', ghiChu: 'Tiếp tục công việc' },
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
    trangThai: 'TAM_DONG',
    ngayTao: '2026-06-15T10:00:00',
    phienLamViec: [
      {
        id: 1,
        ngay: '2026-06-15',
        gioMo: '2026-06-15T08:00:00',
        gioDong: '2026-06-15T17:00:00',
        nguoiMo: 'Trần Minh Trưởng Ca',
        nguoiDong: 'Trần Minh Trưởng Ca',
        thanhVien: [
          { id: 1, hoTen: 'Vũ Văn F', chucVu: 'Thợ cơ khí', gioVao: '2026-06-15T08:00:00', gioRa: '2026-06-15T17:00:00' },
          { id: 2, hoTen: 'Đỗ Văn G', chucVu: 'Thợ hàn', gioVao: '2026-06-15T08:00:00', gioRa: '2026-06-15T12:00:00' },
        ],
      },
    ],
    nhatKy: [
      { id: 1, thoiGian: '2026-06-15T10:00:00', hanhDong: 'Tạo phiếu công tác', nguoiThucHien: 'Lê Văn Quản Đốc', ghiChu: 'Phiếu được tạo từ yêu cầu sửa chữa #4' },
      { id: 2, thoiGian: '2026-06-15T08:00:00', hanhDong: 'Mở phiếu (ngày 15/06)', nguoiThucHien: 'Trần Minh Trưởng Ca', ghiChu: 'Bắt đầu thi công' },
      { id: 3, thoiGian: '2026-06-15T17:00:00', hanhDong: 'Đóng phiếu (ngày 15/06)', nguoiThucHien: 'Trần Minh Trưởng Ca', ghiChu: 'Tạm dừng cuối ngày, chờ vật tư thay thế' },
    ],
  },
];

let nextLogId = 100;
let nextSessionId = 100;
let nextMemberId = 1000;

/* --- Helpers --- */
const clone = (obj) => JSON.parse(JSON.stringify(obj));
const currentUserName = () => authService.getCurrentUser()?.hoTen || 'Người dùng hiện tại';
const pad = (n) => String(n).padStart(2, '0');
// Thời gian local dạng 'YYYY-MM-DDTHH:mm:ss' (không Z) để tránh lệch múi giờ
const nowLocalISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const todayStr = () => nowLocalISO().slice(0, 10);
const ddmm = (ngay) => {
  const [, m, d] = ngay.split('-');
  return `${d}/${m}`;
};

const findWO = (id) => mockWorkOrders.find((wo) => wo.id === Number(id));
const activeSession = (wo) =>
  wo.phienLamViec.find((p) => p.gioDong === null) || null;

const pushLog = (wo, hanhDong, ghiChu = '') => {
  wo.nhatKy.push({
    id: nextLogId++,
    thoiGian: nowLocalISO(),
    hanhDong,
    nguoiThucHien: currentUserName(),
    ghiChu,
  });
};

const resolve = (data, delay = 350) =>
  new Promise((res) => setTimeout(() => res({ data: clone(data) }), delay));
const reject = (status, message, delay = 300) =>
  new Promise((_, rej) =>
    setTimeout(() => rej({ response: { status, data: { message } } }), delay)
  );

export const workOrderService = {
  /** Lấy danh sách tất cả phiếu công tác */
  getAll: () => resolve(mockWorkOrders, 400),

  /** Lấy phiếu công tác theo ID */
  getById: (id) => {
    const wo = findWO(id);
    return wo ? resolve(wo) : reject(404, 'Không tìm thấy phiếu công tác');
  },

  /**
   * Mở phiếu cho ngày làm việc mới.
   * Kế thừa thành viên đang làm từ phiên trước (nếu có) làm danh sách khởi tạo.
   */
  openSession: (id) => {
    const wo = findWO(id);
    if (!wo) return reject(404, 'Không tìm thấy phiếu công tác');
    if (wo.trangThai === WORK_ORDER_STATUS.DA_KHOA)
      return reject(400, 'Phiếu đã khóa, không thể mở lại');
    if (activeSession(wo))
      return reject(400, 'Phiếu đang mở, hãy đóng phiên hiện tại trước');

    const now = nowLocalISO();
    const ngay = todayStr();

    // Kế thừa thành viên từ phiên gần nhất
    const lastSession = wo.phienLamViec[wo.phienLamViec.length - 1];
    const carriedMembers = (lastSession?.thanhVien || []).map((m) => ({
      id: nextMemberId++,
      hoTen: m.hoTen,
      chucVu: m.chucVu,
      gioVao: now,
      gioRa: null,
    }));

    wo.phienLamViec.push({
      id: nextSessionId++,
      ngay,
      gioMo: now,
      gioDong: null,
      nguoiMo: currentUserName(),
      nguoiDong: null,
      thanhVien: carriedMembers,
    });
    wo.trangThai = WORK_ORDER_STATUS.DANG_MO;
    pushLog(wo, `Mở phiếu (ngày ${ddmm(ngay)})`, 'Bắt đầu ca làm việc');
    return resolve(wo, 450);
  },

  /**
   * Đóng phiếu cuối ngày. Tự động chốt giờ ra cho thành viên chưa có giờ ra.
   */
  closeSession: (id) => {
    const wo = findWO(id);
    if (!wo) return reject(404, 'Không tìm thấy phiếu công tác');
    const session = activeSession(wo);
    if (!session) return reject(400, 'Không có phiên nào đang mở');

    const now = nowLocalISO();
    session.gioDong = now;
    session.nguoiDong = currentUserName();
    session.thanhVien.forEach((m) => {
      if (!m.gioRa) m.gioRa = now;
    });
    wo.trangThai = WORK_ORDER_STATUS.TAM_DONG;
    pushLog(wo, `Đóng phiếu (ngày ${ddmm(session.ngay)})`, 'Kết thúc ca làm việc');
    return resolve(wo, 450);
  },

  /** Thêm một thành viên thi công vào phiên đang mở */
  addMember: (id, worker) => {
    const wo = findWO(id);
    if (!wo) return reject(404, 'Không tìm thấy phiếu công tác');
    const session = activeSession(wo);
    if (!session) return reject(400, 'Chỉ thêm được nhân viên khi phiếu đang mở');
    if (session.thanhVien.some((m) => m.hoTen === worker.hoTen))
      return reject(400, `${worker.hoTen} đã có trong phiên`);

    session.thanhVien.push({
      id: nextMemberId++,
      hoTen: worker.hoTen,
      chucVu: worker.chucVu,
      gioVao: nowLocalISO(),
      gioRa: null,
    });
    pushLog(wo, 'Thêm nhân viên', `${worker.hoTen} (${worker.chucVu}) tham gia`);
    return resolve(wo);
  },

  /** Cho một thành viên rút khỏi / xóa khỏi phiên đang mở */
  removeMember: (id, memberId) => {
    const wo = findWO(id);
    if (!wo) return reject(404, 'Không tìm thấy phiếu công tác');
    const session = activeSession(wo);
    if (!session) return reject(400, 'Chỉ chỉnh sửa được khi phiếu đang mở');
    const m = session.thanhVien.find((x) => x.id === Number(memberId));
    session.thanhVien = session.thanhVien.filter((x) => x.id !== Number(memberId));
    if (m) pushLog(wo, 'Xóa nhân viên', `${m.hoTen} rời khỏi phiên`);
    return resolve(wo);
  },

  /**
   * Cập nhật giờ vào / giờ ra của một thành viên (chỉ khi đang mở).
   * @param {object} times - { gioVao?: ISOString, gioRa?: ISOString|null }
   */
  updateMemberTime: (id, memberId, times) => {
    const wo = findWO(id);
    if (!wo) return reject(404, 'Không tìm thấy phiếu công tác');
    const session = activeSession(wo);
    if (!session) return reject(400, 'Chỉ chỉnh sửa được khi phiếu đang mở');
    const m = session.thanhVien.find((x) => x.id === Number(memberId));
    if (!m) return reject(404, 'Không tìm thấy nhân viên');
    if (times.gioVao !== undefined) m.gioVao = times.gioVao;
    if (times.gioRa !== undefined) m.gioRa = times.gioRa;
    return resolve(wo, 200);
  },

  /**
   * Khóa phiếu (Task 38) — chỉ thực hiện khi đang TAM_DONG.
   * Quyền do tầng UI kiểm soát (Trưởng ca / Admin).
   */
  lock: (id, ghiChu = '') => {
    const wo = findWO(id);
    if (!wo) return reject(404, 'Không tìm thấy phiếu công tác');
    if (wo.trangThai !== WORK_ORDER_STATUS.TAM_DONG)
      return reject(400, 'Chỉ khóa được khi phiếu đang ở trạng thái "Tạm đóng"');

    wo.trangThai = WORK_ORDER_STATUS.DA_KHOA;
    pushLog(wo, 'Khóa phiếu / Nghiệm thu', ghiChu || 'Đơn vị sửa chữa đã hoàn thành công việc');
    return resolve(wo, 450);
  },

  /**
   * Tạo phiếu công tác mới từ một yêu cầu sửa chữa đã được duyệt.
   * Trạng thái khởi tạo: CHUA_MO. Đội thực hiện dự kiến được lưu vào
   * `thanhVienDuKien` để khi Trưởng ca mở phiên đầu tiên có thể tham khảo.
   *
   * @param {object} request - Đối tượng yêu cầu sửa chữa nguồn (cần id, maKKS, tenThietBi).
   * @param {object} dto - Dữ liệu form:
   *   { maPhieu, noiDung, diaDiem, thoiGianBatDau, thoiGianKetThuc,
   *     toTruong, nguoiChiHuy, nguoiGiamSat, thanhVienDuKien: [{hoTen, chucVu}] }
   */
  createFromRequest: (request, dto) => {
    if (!request?.id) return reject(400, 'Thiếu thông tin yêu cầu nguồn');
    if (mockWorkOrders.some((wo) => wo.maPhieu === dto.maPhieu))
      return reject(400, `Số phiếu ${dto.maPhieu} đã tồn tại`);

    const newId = (mockWorkOrders.reduce((m, wo) => Math.max(m, wo.id), 0) || 0) + 1;
    const now = nowLocalISO();
    const newWO = {
      id: newId,
      maPhieu: dto.maPhieu,
      yeuCauId: request.id,
      maKKS: request.maKKS,
      tenThietBi: request.tenThietBi,
      moTaCongViec: dto.noiDung,
      diaDiem: dto.diaDiem || '',
      thoiGianBatDauDuKien: dto.thoiGianBatDau || null,
      thoiGianKetThucDuKien: dto.thoiGianKetThuc || null,
      nguoiChiHuy: dto.nguoiChiHuy,
      nguoiGiamSat: dto.nguoiGiamSat,
      toTruong: dto.toTruong,
      thanhVienDuKien: Array.isArray(dto.thanhVienDuKien) ? dto.thanhVienDuKien : [],
      trangThai: WORK_ORDER_STATUS.CHUA_MO,
      ngayTao: now,
      phienLamViec: [],
      nhatKy: [
        {
          id: nextLogId++,
          thoiGian: now,
          hanhDong: 'Tạo phiếu công tác',
          nguoiThucHien: currentUserName(),
          ghiChu: `Phiếu được tạo từ yêu cầu sửa chữa #${request.id}`,
        },
      ],
    };
    mockWorkOrders = [newWO, ...mockWorkOrders];
    return resolve(newWO, 500);
  },
};
