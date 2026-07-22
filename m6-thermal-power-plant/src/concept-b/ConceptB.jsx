/* ============================================================
   CONCEPT B — "Hồ sơ kỹ thuật" (Technical Dossier)
   BÀN THỬ Phase 0 — KHÔNG phải code sản xuất, KHÔNG gọi API.

   Dựng lại Dashboard + WorkOrderList bằng ngôn ngữ thị giác mới để so
   với Quiet Studio. Dữ liệu giả bám sát nội dung hai màn thật
   (pages/Dashboard.jsx, components/work_order/WorkOrderList.jsx) — đủ
   để phán xét diện mạo, không đủ để chạy nghiệp vụ. Đó là chủ đích.

   Xoá thư mục này + 2 dòng route trong App.jsx là sạch dấu vết.
   ============================================================ */

import { useState, useMemo } from 'react';
import {
  BsGrid1X2, BsClipboardCheck, BsCpu, BsBoxSeam, BsDropletHalf,
  BsExclamationTriangle, BsFileEarmarkText, BsSearch, BsEye,
  BsArrowRepeat, BsPencilSquare, BsPeople, BsTools,
} from 'react-icons/bs';
import './ConceptB.css';

/* ============================================================
   DỮ LIỆU GIẢ — theo đúng nội dung màn thật
   ============================================================ */

const DASH_STATS = [
  { label: 'Thiết bị', value: 247, trend: '+3', dir: 'up', fill: 0.92, tone: 'var(--cb-ink-2)' },
  { label: 'Đang sửa chữa', value: 12, trend: '+2', dir: 'up', fill: 0.28, tone: 'var(--cb-info)' },
  { label: 'Yêu cầu chờ', value: 5, trend: '−1', dir: 'down', fill: 0.16, tone: 'var(--cb-warning)' },
  { label: 'Sự cố khẩn', value: 2, trend: '+1', dir: 'up', fill: 0.08, tone: 'var(--cb-danger)' },
];

const RECENT_REQUESTS = [
  { id: 1, ma: 'YC-2026-0045', tb: 'Bơm cấp nước thô', kks: 'ABC002M1', mucDo: 'warning', mucDoLabel: 'Cảnh báo', ngay: '19/06/2026' },
  { id: 2, ma: 'YC-2026-0044', tb: 'Động cơ bơm nước thải', kks: 'DEF005E2', mucDo: 'danger', mucDoLabel: 'Khẩn cấp', ngay: '18/06/2026' },
  { id: 3, ma: 'YC-2026-0043', tb: 'Van điều khiển áp suất', kks: 'GHI010V3', mucDo: 'normal', mucDoLabel: 'Bình thường', ngay: '17/06/2026' },
  { id: 4, ma: 'YC-2026-0042', tb: 'Đồng hồ đo áp suất', kks: 'ABC002I1', mucDo: 'warning', mucDoLabel: 'Cảnh báo', ngay: '17/06/2026' },
  { id: 5, ma: 'YC-2026-0041', tb: 'Máy nén khí chính', kks: 'JKL003M5', mucDo: 'danger', mucDoLabel: 'Khẩn cấp', ngay: '16/06/2026' },
];

const EQUIPMENT_STATUS = [
  { label: 'Đang vận hành', count: 218, status: 'normal' },
  { label: 'Đang sửa chữa', count: 12, status: 'info' },
  { label: 'Đang dự phòng', count: 15, status: 'inactive' },
  { label: 'Sự cố', count: 2, status: 'danger' },
];

const QUICK_ACTIONS = [
  { icon: <BsExclamationTriangle />, label: 'Tạo yêu cầu sửa chữa', code: 'PYC', tone: 'var(--cb-warning)' },
  { icon: <BsFileEarmarkText />, label: 'Lập phiếu công tác', code: 'PCT', tone: 'var(--cb-info)' },
  { icon: <BsBoxSeam />, label: 'Nhập kho vật tư', code: 'VT', tone: 'var(--cb-ink-2)' },
  { icon: <BsDropletHalf />, label: 'Lịch bảo dưỡng', code: 'BD', tone: 'var(--cb-normal)' },
];

const TRANG_THAI = {
  OPEN: { label: 'Chờ duyệt', status: 'info' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  WAITING_FOR_APPROVAL: { label: 'Chờ duyệt gia hạn', status: 'warning' },
  APPROVED: { label: 'Đã duyệt', status: 'info' },
  STOPPED: { label: 'Tạm dừng', status: 'inactive' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
};

const FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'OPEN', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { key: 'STOPPED', label: 'Tạm dừng' },
  { key: 'WAITING_FOR_APPROVAL', label: 'Chờ duyệt gia hạn' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã huỷ' },
];

const WORK_ORDERS = [
  { id: 1, code: 'PCT-2026-0132', tb: 'Bơm cấp nước thô', kks: 'ABC002M1', yc: 'YC-2026-0045', ld: 'Nguyễn Văn Hùng', start: '19/06/2026 07:30', end: '19/06/2026 16:00', status: 'IN_PROGRESS' },
  { id: 2, code: 'PCT-2026-0131', tb: 'Động cơ bơm nước thải', kks: 'DEF005E2', yc: 'YC-2026-0044', ld: 'Trần Quốc Bảo', start: '18/06/2026 08:00', end: '20/06/2026 17:00', status: 'WAITING_FOR_APPROVAL' },
  { id: 3, code: 'PCT-2026-0130', tb: 'Van điều khiển áp suất', kks: 'GHI010V3', yc: 'YC-2026-0043', ld: 'Lê Minh Tuấn', start: '17/06/2026 13:00', end: '17/06/2026 18:30', status: 'COMPLETED' },
  { id: 4, code: 'PCT-2026-0129', tb: 'Máy nén khí chính', kks: 'JKL003M5', yc: 'YC-2026-0041', ld: 'Phạm Thị Lan', start: '16/06/2026 06:00', end: '18/06/2026 16:00', status: 'IN_PROGRESS' },
  { id: 5, code: 'PCT-2026-0128', tb: 'Quạt khói lò hơi B', kks: 'MNO007M2', yc: 'YC-2026-0040', ld: 'Đỗ Văn Thành', start: '15/06/2026 07:00', end: '15/06/2026 15:00', status: 'OPEN' },
  { id: 6, code: 'PCT-2026-0127', tb: 'Máy biến áp tự dùng 6kV', kks: 'PQR001E1', yc: 'YC-2026-0039', ld: 'Vũ Đình Nam', start: '14/06/2026 08:30', end: '14/06/2026 12:00', status: 'STOPPED' },
  { id: 7, code: 'PCT-2026-0126', tb: 'Bơm dầu bôi trơn tua-bin', kks: 'STU004M3', yc: 'YC-2026-0038', ld: 'Hoàng Anh Dũng', start: '13/06/2026 09:00', end: '13/06/2026 14:30', status: 'COMPLETED' },
  { id: 8, code: 'PCT-2026-0125', tb: 'Máy cắt đầu cực máy phát', kks: 'VWX002E4', yc: 'YC-2026-0037', ld: 'Bùi Thanh Sơn', start: '12/06/2026 07:30', end: '12/06/2026 11:00', status: 'CANCELLED' },
];

/* ============================================================
   MẢNH GHÉP DÙNG CHUNG
   ============================================================ */

function Stamp({ status, label }) {
  return <span className={`cb-stamp ${status}`}>{label}</span>;
}

function Sheet({ title, action, children, bodyPad = true }) {
  return (
    <section className="cb-sheet">
      <header className="cb-sheet-head">
        <span className="cb-sheet-title">{title}</span>
        {action}
      </header>
      <div className={bodyPad ? 'cb-sheet-body' : undefined}>{children}</div>
    </section>
  );
}

function StatBlock({ label, value, trend, dir, fill, tone }) {
  return (
    <div className="cb-stat">
      <span className="cb-stat-label">{label}</span>
      <div className="cb-stat-row">
        <span className="cb-stat-value">{value}</span>
        {trend && <span className={`cb-stat-trend ${dir}`}>{trend}</span>}
      </div>
      <div className="cb-stat-rule">
        <i style={{ width: `${fill * 100}%`, background: tone }} />
      </div>
    </div>
  );
}

function PageHead({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="cb-pagehead">
      <div>
        <div className="cb-eyebrow">{eyebrow}</div>
        <h1 className="cb-title">{title}</h1>
        {subtitle && <p className="cb-subtitle">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

/* ============================================================
   MÀN 1 — BẢNG ĐIỀU KHIỂN
   ============================================================ */

function DashboardView() {
  const total = EQUIPMENT_STATUS.reduce((s, e) => s + e.count, 0);

  return (
    <>
      <PageHead
        eyebrow="SCMS / Tổng quan"
        title="Bảng điều khiển"
        subtitle="Tổng quan tình trạng vận hành nhà máy"
        actions={<div className="cb-topbar-meta">Ca trực 19/06/2026 · 07:00–19:00</div>}
      />

      <div className="cb-stats">
        {DASH_STATS.map((s) => <StatBlock key={s.label} {...s} />)}
      </div>

      <div className="cb-grid">
        <Sheet
          title="Yêu cầu sửa chữa gần đây"
          action={<button className="cb-btn cb-btn-sm">Xem tất cả</button>}
          bodyPad={false}
        >
          <table className="cb-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Thiết bị</th>
                <th>Mã KKS</th>
                <th>Mức độ</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_REQUESTS.map((r) => (
                <tr key={r.id}>
                  <td className="cb-mono cb-strong">{r.ma}</td>
                  <td>{r.tb}</td>
                  <td className="cb-mono">{r.kks}</td>
                  <td><Stamp status={r.mucDo} label={r.mucDoLabel} /></td>
                  <td className="cb-mono cb-muted">{r.ngay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sheet>

        <div style={{ display: 'grid', gap: 18 }}>
          <Sheet title="Trạng thái thiết bị">
            {EQUIPMENT_STATUS.map((e) => (
              <div key={e.label} className="cb-eq-row">
                <Stamp status={e.status} label={e.label} />
                <span className="cb-eq-count">{e.count}</span>
              </div>
            ))}
            <div className="cb-bar">
              {EQUIPMENT_STATUS.map((e) => (
                <i
                  key={e.label}
                  title={`${e.label}: ${e.count}`}
                  style={{ width: `${(e.count / total) * 100}%`, background: `var(--cb-${e.status})` }}
                />
              ))}
            </div>
            <div className="cb-total">Tổng cộng {total} thiết bị</div>
          </Sheet>

          <Sheet title="Truy cập nhanh">
            <div className="cb-qa">
              {QUICK_ACTIONS.map((a) => (
                <button key={a.code} className="cb-qa-btn">
                  <span className="cb-qa-icon" style={{ color: a.tone }}>{a.icon}</span>
                  <span>{a.label}</span>
                  <span className="cb-qa-num">{a.code}</span>
                </button>
              ))}
            </div>
          </Sheet>
        </div>
      </div>

      <div className="cb-formnote">
        <span>SCMS · Hệ thống Quản lý Sửa chữa &amp; Bảo dưỡng</span>
        <span>Concept B — Hồ sơ kỹ thuật</span>
      </div>
    </>
  );
}

/* ============================================================
   MÀN 2 — PHIẾU CÔNG TÁC
   ============================================================ */

function WorkOrderView() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    let out = WORK_ORDERS;
    if (filter !== 'ALL') out = out.filter((r) => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((r) =>
        r.code.toLowerCase().includes(q) ||
        r.yc.toLowerCase().includes(q) ||
        r.tb.toLowerCase().includes(q)
      );
    }
    return out;
  }, [filter, search]);

  const countOf = (key) =>
    key === 'ALL' ? WORK_ORDERS.length : WORK_ORDERS.filter((r) => r.status === key).length;

  const stats = [
    { label: 'Tổng PCT', value: WORK_ORDERS.length, fill: 1, tone: 'var(--cb-ink-2)' },
    { label: 'Chờ duyệt', value: countOf('OPEN'), fill: countOf('OPEN') / WORK_ORDERS.length, tone: 'var(--cb-info)' },
    { label: 'Đang thực hiện', value: countOf('IN_PROGRESS'), fill: countOf('IN_PROGRESS') / WORK_ORDERS.length, tone: 'var(--cb-warning)' },
    { label: 'Hoàn thành', value: countOf('COMPLETED'), fill: countOf('COMPLETED') / WORK_ORDERS.length, tone: 'var(--cb-normal)' },
  ];

  return (
    <>
      <PageHead
        eyebrow="SCMS / Sửa chữa"
        title="Phiếu công tác"
        subtitle="Danh sách phiếu công tác (PCT) được tạo từ yêu cầu sửa chữa"
        actions={<button className="cb-btn cb-btn-sm">Làm mới</button>}
      />

      <div className="cb-stats">
        {stats.map((s) => <StatBlock key={s.label} {...s} />)}
      </div>

      <div className="cb-toolbar">
        <label className="cb-search">
          <BsSearch style={{ color: 'var(--cb-ink-3)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã PCT, mã yêu cầu hoặc nội dung..."
          />
        </label>
        <button className="cb-btn cb-btn-primary">Lập phiếu công tác</button>
      </div>

      <div className="cb-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`cb-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="cb-tab-count">{countOf(f.key)}</span>
          </button>
        ))}
      </div>

      <div className="cb-sheet" style={{ borderTop: 0 }}>
        <table className="cb-table">
          <thead>
            <tr>
              <th>Mã PCT</th>
              <th>Thiết bị</th>
              <th>Mã YC</th>
              <th>Người lãnh đạo</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const t = TRANG_THAI[r.status];
              const done = r.status === 'COMPLETED' || r.status === 'CANCELLED';
              return (
                <tr key={r.id}>
                  <td className="cb-mono cb-strong">{r.code}</td>
                  <td>
                    <div className="cb-strong">{r.tb}</div>
                    <div className="cb-sub">{r.kks}</div>
                  </td>
                  <td className="cb-mono">{r.yc}</td>
                  <td>{r.ld}</td>
                  <td>
                    <div className="cb-mono cb-num" style={{ fontSize: 11.5 }}>{r.start}</div>
                    <div className="cb-sub">DK kết thúc: {r.end}</div>
                  </td>
                  <td><Stamp status={t.status} label={t.label} /></td>
                  <td>
                    <div className="cb-actions" style={{ justifyContent: 'flex-end' }}>
                      <button className="cb-btn cb-btn-sm" title="Xem chi tiết"><BsEye /></button>
                      <button className="cb-btn cb-btn-sm" disabled={done} title="Cập nhật trạng thái"><BsArrowRepeat /></button>
                      <button className="cb-btn cb-btn-sm" disabled={done} title="Sửa thông tin"><BsPencilSquare /></button>
                      <button className="cb-btn cb-btn-sm" disabled={done} title="Cấp vật tư"><BsBoxSeam /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="cb-pager">
        <button className="cb-btn cb-btn-sm" disabled>← Trước</button>
        <span className="cb-pager-info">Trang 1 / 1 · {rows.length} phiếu</span>
        <button className="cb-btn cb-btn-sm" disabled>Sau →</button>
      </div>

      <div className="cb-formnote">
        <span>Biểu mẫu PCT-01/SCMS · Lưu hồ sơ 05 năm</span>
        <span>Concept B — Hồ sơ kỹ thuật</span>
      </div>
    </>
  );
}

/* ============================================================
   KHUNG CONCEPT — sidebar + topbar + 2 màn
   ============================================================ */

const NAV = [
  { section: 'Vận hành', items: [
    { key: 'dashboard', label: 'Bảng điều khiển', icon: <BsGrid1X2 /> },
    { key: 'equipment', label: 'Hệ thống & Thiết bị', icon: <BsCpu /> },
  ]},
  { section: 'Sửa chữa', items: [
    { key: 'requests', label: 'Yêu cầu sửa chữa', icon: <BsExclamationTriangle /> },
    { key: 'workorders', label: 'Phiếu công tác', icon: <BsClipboardCheck /> },
    { key: 'assessment', label: 'Đánh giá kỹ thuật', icon: <BsFileEarmarkText /> },
  ]},
  { section: 'Kho', items: [
    { key: 'material', label: 'Vật tư', icon: <BsBoxSeam /> },
    { key: 'tools', label: 'Công cụ dụng cụ', icon: <BsTools /> },
  ]},
  { section: 'Nhân sự', items: [
    { key: 'hr', label: 'Nhân sự & Tài khoản', icon: <BsPeople /> },
  ]},
];

export default function ConceptB() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="cb-root">
      <aside className="cb-side">
        <div className="cb-brand">
          <div className="cb-brand-name">SCMS</div>
          <div className="cb-brand-sub">Nhiệt điện · Sửa chữa</div>
        </div>

        {NAV.map((g) => (
          <div key={g.section}>
            <div className="cb-side-label">{g.section}</div>
            {g.items.map((it) => {
              const active = view === it.key;
              const live = it.key === 'dashboard' || it.key === 'workorders';
              return (
                <button
                  key={it.key}
                  className={`cb-nav-item ${active ? 'active' : ''}`}
                  onClick={() => live && setView(it.key)}
                  style={live ? undefined : { opacity: 0.45, cursor: 'default' }}
                  title={live ? undefined : 'Ngoài phạm vi bàn thử'}
                >
                  {it.icon}
                  {it.label}
                </button>
              );
            })}
          </div>
        ))}

        <div className="cb-side-foot">
          CONCEPT B<br />Hồ sơ kỹ thuật
        </div>
      </aside>

      <div className="cb-main">
        <header className="cb-topbar">
          <span className="cb-topbar-meta">BÀN THỬ PHASE 0 · DỮ LIỆU GIẢ · KHÔNG PHẢI BẢN CHẠY THẬT</span>
          <div className="cb-user">
            <div style={{ textAlign: 'right' }}>
              <div className="cb-user-name">Nguyễn Trung Hiếu</div>
              <div className="cb-user-role">Trưởng ca</div>
            </div>
            <div className="cb-avatar">NH</div>
          </div>
        </header>

        <main className="cb-content">
          {view === 'dashboard' ? <DashboardView /> : <WorkOrderView />}
        </main>
      </div>
    </div>
  );
}
