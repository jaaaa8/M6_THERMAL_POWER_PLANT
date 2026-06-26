import { useMemo, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import {
  BsExclamationTriangle, BsEye, BsFileEarmarkPlus, BsArrowClockwise,
  BsListUl, BsHourglassSplit, BsFileEarmarkCheck, BsLightningChargeFill,
  BsCpu,
} from 'react-icons/bs';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ModalCreateWorkOrder from '../components/repair/ModalCreateWorkOrder.jsx';
import './RepairRequest.css';

/* ============================================================
   MAPS — Mức độ & Trạng thái
   ============================================================ */
const MUC_DO_MAP = {
  danger: { label: 'Khẩn cấp', status: 'danger', pulse: true },
  warning: { label: 'Ưu tiên cao', status: 'warning' },
  normal: { label: 'Bình thường', status: 'normal' },
};

const TRANG_THAI_MAP = {
  CHO_XU_LY: { label: 'Chờ xử lý', status: 'warning' },
  DA_LAP_PCT: { label: 'Đã lập PCT', status: 'info' },
  HOAN_THANH: { label: 'Hoàn thành', status: 'normal' },
  TU_CHOI: { label: 'Từ chối', status: 'inactive' },
};

/* ============================================================
   SAMPLE DATA — Dữ liệu mẫu (chỉ phục vụ hiển thị UI)
   ============================================================ */
const SAMPLE_NHAN_VIEN = [
  { id: 'NV001', hoTen: 'Trần Phước Trí', chucVu: 'Quản đốc sửa chữa' },
  { id: 'NV002', hoTen: 'Lê Văn Hải', chucVu: 'Tổ trưởng cơ khí' },
  { id: 'NV003', hoTen: 'Phạm Minh Châu', chucVu: 'KTV an toàn' },
  { id: 'NV004', hoTen: 'Nguyễn Quốc Huy', chucVu: 'Thợ cơ khí bậc 5' },
  { id: 'NV005', hoTen: 'Võ Thành Đạt', chucVu: 'Thợ điện bậc 4' },
  { id: 'NV006', hoTen: 'Đặng Thị Lan', chucVu: 'KTV đo lường' },
  { id: 'NV007', hoTen: 'Bùi Văn Khoa', chucVu: 'Thợ hàn bậc 6' },
  { id: 'NV008', hoTen: 'Hoàng Minh Tuấn', chucVu: 'Thợ cơ khí bậc 4' },
];

const SAMPLE_REQUESTS = [
  {
    id: 1, maRequest: 'YC-2026-0048', thietBi: 'Bơm cấp nước thô', maKKS: 'ABC002M1',
    heThong: 'Hệ thống xử lý nước thô',
    moTa: 'Bơm phát ra tiếng ồn bất thường, rò rỉ nước tại phớt cơ khí, độ rung vượt ngưỡng cho phép.',
    mucDo: 'danger', nguoiYeuCau: 'Nguyễn Văn Trưởng (Trưởng ca A)',
    ngayYeuCau: '24/06/2026 06:15', trangThai: 'CHO_XU_LY',
  },
  {
    id: 2, maRequest: 'YC-2026-0047', thietBi: 'Động cơ bơm nước thải', maKKS: 'DEF005E2',
    heThong: 'Hệ thống xử lý nước thải',
    moTa: 'Động cơ nóng bất thường, dòng điện tăng cao khi vận hành tải định mức.',
    mucDo: 'warning', nguoiYeuCau: 'Lê Hoàng Kíp (Trưởng kíp 2)',
    ngayYeuCau: '24/06/2026 04:40', trangThai: 'CHO_XU_LY',
  },
  {
    id: 3, maRequest: 'YC-2026-0046', thietBi: 'Van điều khiển áp suất', maKKS: 'GHI010V3',
    heThong: 'Hệ thống lò hơi phụ',
    moTa: 'Van đóng/mở không dứt khoát, nghi kẹt cơ cấu chấp hành.',
    mucDo: 'normal', nguoiYeuCau: 'Trần Đình Ca (Trưởng ca B)',
    ngayYeuCau: '23/06/2026 22:10', trangThai: 'CHO_XU_LY',
  },
  {
    id: 4, maRequest: 'YC-2026-0045', thietBi: 'Đồng hồ đo áp suất đầu hút', maKKS: 'ABC002I1',
    heThong: 'Hệ thống xử lý nước thô',
    moTa: 'Kim đồng hồ không trở về 0, sai số chỉ thị lớn.',
    mucDo: 'normal', nguoiYeuCau: 'Nguyễn Văn Trưởng (Trưởng ca A)',
    ngayYeuCau: '23/06/2026 15:25', trangThai: 'DA_LAP_PCT',
  },
  {
    id: 5, maRequest: 'YC-2026-0044', thietBi: 'Máy nén khí chính', maKKS: 'JKL003M5',
    heThong: 'Hệ thống khí nén',
    moTa: 'Áp suất khí nén không đạt, rò rỉ khí tại đường ống đầu đẩy.',
    mucDo: 'danger', nguoiYeuCau: 'Phạm Thanh Kíp (Trưởng kíp 1)',
    ngayYeuCau: '22/06/2026 09:00', trangThai: 'DA_LAP_PCT',
  },
  {
    id: 6, maRequest: 'YC-2026-0043', thietBi: 'Quạt khói lò hơi', maKKS: 'MNO007F1',
    heThong: 'Hệ thống lò hơi phụ',
    moTa: 'Vòng bi quạt khói có dấu hiệu mòn, nhiệt độ gối đỡ tăng.',
    mucDo: 'warning', nguoiYeuCau: 'Trần Đình Ca (Trưởng ca B)',
    ngayYeuCau: '21/06/2026 13:30', trangThai: 'HOAN_THANH',
  },
  {
    id: 7, maRequest: 'YC-2026-0042', thietBi: 'Bơm nước làm mát', maKKS: 'PQR009M2',
    heThong: 'Hệ thống nước làm mát',
    moTa: 'Yêu cầu kiểm tra định kỳ, không phát hiện hư hỏng nghiêm trọng.',
    mucDo: 'normal', nguoiYeuCau: 'Lê Hoàng Kíp (Trưởng kíp 2)',
    ngayYeuCau: '20/06/2026 08:45', trangThai: 'TU_CHOI',
  },
];

/* ============================================================
   FILTER PILLS
   ============================================================ */
const FILTERS = [
  { key: 'CHO_XU_LY', label: 'Chờ xử lý' },
  { key: 'ALL', label: 'Tất cả' },
  { key: 'DA_LAP_PCT', label: 'Đã lập PCT' },
  { key: 'HOAN_THANH', label: 'Hoàn thành' },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function RepairRequest() {
  const [requests, setRequests] = useState(SAMPLE_REQUESTS);
  const [filter, setFilter] = useState('CHO_XU_LY');
  const [pctRequest, setPctRequest] = useState(null);   // request đang lập PCT
  const [detailRequest, setDetailRequest] = useState(null); // request đang xem chi tiết

  /* --- Thống kê --- */
  const stats = useMemo(() => {
    const choXuLy = requests.filter((r) => r.trangThai === 'CHO_XU_LY');
    return [
      { key: 'total', label: 'Tổng yêu cầu', value: requests.length, icon: <BsListUl />, color: 'var(--color-primary-500)' },
      { key: 'pending', label: 'Đang chờ xử lý', value: choXuLy.length, icon: <BsHourglassSplit />, color: 'var(--color-status-warning)' },
      { key: 'pct', label: 'Đã lập PCT', value: requests.filter((r) => r.trangThai === 'DA_LAP_PCT').length, icon: <BsFileEarmarkCheck />, color: 'var(--color-status-info)' },
      { key: 'urgent', label: 'Khẩn cấp (chờ)', value: choXuLy.filter((r) => r.mucDo === 'danger').length, icon: <BsLightningChargeFill />, color: 'var(--color-status-danger)' },
    ];
  }, [requests]);

  /* --- Lọc theo trạng thái --- */
  const filtered = useMemo(() => {
    if (filter === 'ALL') return requests;
    return requests.filter((r) => r.trangThai === filter);
  }, [requests, filter]);

  /* --- Cột bảng --- */
  const columns = [
    { key: 'maRequest', label: 'Mã YC', mono: true, width: 130 },
    { key: 'thietBi', label: 'Thiết bị' },
    { key: 'maKKS', label: 'Mã KKS', mono: true, width: 110 },
    {
      key: 'mucDo', label: 'Mức độ', width: 130,
      render: (val) => {
        const m = MUC_DO_MAP[val] || MUC_DO_MAP.normal;
        return <StatusBadge status={m.status} label={m.label} pulse={m.pulse} />;
      },
    },
    { key: 'nguoiYeuCau', label: 'Người yêu cầu' },
    { key: 'ngayYeuCau', label: 'Thời gian', width: 150 },
    {
      key: 'trangThai', label: 'Trạng thái', width: 130,
      render: (val) => {
        const t = TRANG_THAI_MAP[val] || TRANG_THAI_MAP.CHO_XU_LY;
        return <StatusBadge status={t.status} label={t.label} />;
      },
    },
  ];

  /* --- Khi tạo PCT thành công: cập nhật trạng thái request (chỉ trên UI) --- */
  const handlePCTCreated = (request) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, trangThai: 'DA_LAP_PCT' } : r))
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Yêu cầu Sửa chữa"
        subtitle="Tiếp nhận yêu cầu từ Trưởng ca / Trưởng kíp và lập phiếu công tác"
        icon={<BsExclamationTriangle />}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={() => setRequests(SAMPLE_REQUESTS)}>
            <BsArrowClockwise className="me-1" /> Làm mới
          </Button>
        }
      />

      {/* ===== STATS ===== */}
      <div className="yc-stats">
        {stats.map((s) => (
          <div key={s.key} className="yc-stat surface-card">
            <span className="yc-stat-icon" style={{ color: s.color }}>{s.icon}</span>
            <div className="yc-stat-body">
              <span className="yc-stat-value">{s.value}</span>
              <span className="yc-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== FILTER PILLS ===== */}
      <div className="yc-filter-pills">
        {FILTERS.map((f) => {
          const count = f.key === 'ALL'
            ? requests.length
            : requests.filter((r) => r.trangThai === f.key).length;
          return (
            <button
              key={f.key}
              className={`yc-pill ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="yc-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ===== TABLE ===== */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Tìm theo mã YC, thiết bị, mã KKS..."
        pageSize={8}
        renderActions={(row) => (
          <div className="data-table-actions">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDetailRequest(row)}
              title="Xem chi tiết"
            >
              <BsEye />
            </button>
            {row.trangThai === 'CHO_XU_LY' ? (
              <button
                className="btn btn-sm btn-primary yc-btn-pct"
                onClick={() => setPctRequest(row)}
                title="Tạo phiếu công tác"
              >
                <BsFileEarmarkPlus /> Tạo PCT
              </button>
            ) : (
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>—</span>
            )}
          </div>
        )}
      />

      {/* ===== MODAL: TẠO PCT ===== */}
      <ModalCreateWorkOrder
        show={!!pctRequest}
        request={pctRequest}
        nhanVienOptions={SAMPLE_NHAN_VIEN}
        onClose={() => setPctRequest(null)}
        onCreated={handlePCTCreated}
      />

      {/* ===== MODAL: CHI TIẾT REQUEST ===== */}
      <RequestDetailModal request={detailRequest} onClose={() => setDetailRequest(null)} />
    </div>
  );
}

/* ============================================================
   Modal chi tiết yêu cầu (chỉ đọc)
   ============================================================ */
function RequestDetailModal({ request, onClose }) {
  if (!request) return null;
  const m = MUC_DO_MAP[request.mucDo] || MUC_DO_MAP.normal;
  const t = TRANG_THAI_MAP[request.trangThai] || TRANG_THAI_MAP.CHO_XU_LY;

  return (
    <Modal show={!!request} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsCpu className="me-2" style={{ color: 'var(--color-primary-500)' }} />
          Chi tiết yêu cầu {request.maRequest}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="yc-detail-grid">
          <DetailRow label="Mã yêu cầu" value={<span className="font-mono">{request.maRequest}</span>} />
          <DetailRow label="Trạng thái" value={<StatusBadge status={t.status} label={t.label} />} />
          <DetailRow label="Thiết bị" value={request.thietBi} />
          <DetailRow label="Mã KKS" value={<span className="font-mono">{request.maKKS}</span>} />
          <DetailRow label="Hệ thống" value={request.heThong} />
          <DetailRow label="Mức độ" value={<StatusBadge status={m.status} label={m.label} pulse={m.pulse} />} />
          <DetailRow label="Người yêu cầu" value={request.nguoiYeuCau} />
          <DetailRow label="Thời gian" value={request.ngayYeuCau} />
        </div>
        <div className="yc-detail-desc">
          <span className="yc-detail-label">Mô tả hư hỏng</span>
          <p>{request.moTa}</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="yc-detail-item">
      <span className="yc-detail-label">{label}</span>
      <span className="yc-detail-value">{value}</span>
    </div>
  );
}
