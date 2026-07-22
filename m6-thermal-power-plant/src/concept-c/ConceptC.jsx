/* ============================================================
   CONCEPT C — "Thép & Biển báo" (Steel & Signage)
   BÀN THỬ Phase 0 — KHÔNG phải code sản xuất, KHÔNG gọi API.

   Hướng thứ ba để so với A ("Phòng điều khiển") và B ("Hồ sơ kỹ thuật").
   Cùng dữ liệu, cùng hai màn — chỉ khác ngôn ngữ thị giác.

   ponytail: dữ liệu giả nhân bản từ concept-a|b thay vì tách file dùng
   chung. Cố ý — ba concept phải xoá được độc lập; khi hai cái thua thì
   `rm -rf` chúng không được làm cái thắng chết theo.

   Xoá thư mục này + 2 dòng route trong App.jsx là sạch dấu vết.
   ============================================================ */

import { useState, useMemo } from 'react';
import {
  BsGrid1X2, BsClipboardCheck, BsCpu, BsBoxSeam, BsDropletHalf,
  BsExclamationTriangle, BsFileEarmarkText, BsSearch, BsEye,
  BsArrowRepeat, BsPencilSquare, BsPeople, BsTools,
} from 'react-icons/bs';
import './ConceptC.css';

/* ============================================================
   DỮ LIỆU GIẢ — khớp concept-a|b để so sánh công bằng
   ============================================================ */

const DASH_STATS = [
  { label: 'Thiết bị', unit: 'Tổng', value: 247, delta: '+3', dir: 'up', fill: 0.92, tone: 'var(--cc-inactive)' },
  { label: 'Đang sửa chữa', unit: 'PCT', value: 12, delta: '+2', dir: 'up', fill: 0.28, tone: 'var(--cc-info)' },
  { label: 'Yêu cầu chờ', unit: 'PYC', value: 5, delta: '−1', dir: 'down', fill: 0.16, tone: 'var(--cc-warning)' },
  { label: 'Sự cố khẩn', unit: 'Alarm', value: 2, delta: '+1', dir: 'up', fill: 0.08, tone: 'var(--cc-danger)', hazard: true },
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
  { icon: <BsExclamationTriangle />, label: 'Tạo yêu cầu sửa chữa', code: 'PYC' },
  { icon: <BsFileEarmarkText />, label: 'Lập phiếu công tác', code: 'PCT' },
  { icon: <BsBoxSeam />, label: 'Nhập kho vật tư', code: 'VT' },
  { icon: <BsDropletHalf />, label: 'Lịch bảo dưỡng', code: 'BD' },
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
   MẢNH GHÉP
   ============================================================ */

function Sign({ status, label }) {
  return <span className={`cc-sign ${status}`}>{label}</span>;
}

function Stat({ label, unit, value, delta, dir, fill, tone, hazard }) {
  return (
    <div className="cc-stat">
      <div className="cc-stat-bar">
        <span>{label}</span>
        <span>{unit}</span>
      </div>
      {hazard && <div className="cc-hazard" />}
      <div className="cc-stat-body">
        <div className="cc-stat-row">
          <span className="cc-stat-value">{value}</span>
          {delta && (
            <span className="cc-stat-delta" style={{ color: dir === 'up' ? 'var(--cc-danger)' : 'var(--cc-normal)' }}>
              {delta}
            </span>
          )}
        </div>
        <div className="cc-stat-track">
          <i style={{ width: `${fill * 100}%`, background: tone }} />
        </div>
      </div>
    </div>
  );
}

function Plate({ title, action, children, bodyPad = true }) {
  return (
    <section className="cc-plate">
      <header className="cc-plate-head">
        <span>{title}</span>
        {action}
      </header>
      <div className={bodyPad ? 'cc-plate-body' : undefined}>{children}</div>
    </section>
  );
}

function PageHead({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="cc-pagehead">
      <div>
        <div className="cc-stencil">{eyebrow}</div>
        <h1 className="cc-title">{title}</h1>
        {subtitle && <p className="cc-subtitle">{subtitle}</p>}
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
        actions={<span className="cc-stencil">Ca trực 19/06/2026 · 07:00–19:00</span>}
      />

      <div className="cc-stats">
        {DASH_STATS.map((s) => <Stat key={s.label} {...s} />)}
      </div>

      <div className="cc-grid">
        <Plate
          title="Yêu cầu sửa chữa gần đây"
          action={<button className="cc-btn cc-btn-sm" style={{ borderColor: 'var(--cc-on-black)', color: 'var(--cc-on-black)' }}>Xem tất cả</button>}
          bodyPad={false}
        >
          <table className="cc-table">
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
                  <td className="cc-mono cc-strong">{r.ma}</td>
                  <td className="cc-strong">{r.tb}</td>
                  <td className="cc-mono cc-muted">{r.kks}</td>
                  <td><Sign status={r.mucDo} label={r.mucDoLabel} /></td>
                  <td className="cc-mono cc-muted">{r.ngay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Plate>

        <div style={{ display: 'grid', gap: 12 }}>
          <Plate title="Trạng thái thiết bị">
            {EQUIPMENT_STATUS.map((e) => (
              <div key={e.label} className="cc-eq-row">
                <Sign status={e.status} label={e.label} />
                <span className="cc-eq-count">{e.count}</span>
              </div>
            ))}
            <div className="cc-bar">
              {EQUIPMENT_STATUS.map((e) => (
                <i
                  key={e.label}
                  title={`${e.label}: ${e.count}`}
                  style={{ width: `${(e.count / total) * 100}%`, background: `var(--cc-${e.status})` }}
                />
              ))}
            </div>
            <div className="cc-total">
              <span className="cc-stencil">Tổng cộng {total} thiết bị</span>
            </div>
          </Plate>

          <Plate title="Truy cập nhanh">
            <div className="cc-qa">
              {QUICK_ACTIONS.map((a) => (
                <button key={a.code} className="cc-qa-btn">
                  <span className="cc-qa-icon">{a.icon}</span>
                  <span>{a.label}</span>
                  <span className="cc-stencil">{a.code}</span>
                </button>
              ))}
            </div>
          </Plate>
        </div>
      </div>

      <div className="cc-foot">
        <span className="cc-stencil">SCMS · Hệ thống Quản lý Sửa chữa &amp; Bảo dưỡng</span>
        <span className="cc-stencil">Concept C — Thép &amp; Biển báo</span>
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
    { label: 'Tổng PCT', unit: 'All', value: WORK_ORDERS.length, fill: 1, tone: 'var(--cc-inactive)' },
    { label: 'Chờ duyệt', unit: 'Open', value: countOf('OPEN'), fill: countOf('OPEN') / WORK_ORDERS.length, tone: 'var(--cc-info)' },
    { label: 'Đang thực hiện', unit: 'Run', value: countOf('IN_PROGRESS'), fill: countOf('IN_PROGRESS') / WORK_ORDERS.length, tone: 'var(--cc-warning)' },
    { label: 'Hoàn thành', unit: 'Done', value: countOf('COMPLETED'), fill: countOf('COMPLETED') / WORK_ORDERS.length, tone: 'var(--cc-normal)' },
  ];

  return (
    <>
      <PageHead
        eyebrow="SCMS / Sửa chữa"
        title="Phiếu công tác"
        subtitle="Danh sách phiếu công tác (PCT) được tạo từ yêu cầu sửa chữa"
        actions={<button className="cc-btn cc-btn-sm">Làm mới</button>}
      />

      <div className="cc-stats">
        {stats.map((s) => <Stat key={s.label} {...s} />)}
      </div>

      <div className="cc-toolbar">
        <label className="cc-search">
          <BsSearch style={{ color: 'var(--cc-text-3)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã PCT, mã yêu cầu hoặc nội dung..."
          />
        </label>
        <button className="cc-btn cc-btn-solid">Lập phiếu công tác</button>
      </div>

      <div className="cc-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`cc-filter ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="cc-filter-count">{countOf(f.key)}</span>
          </button>
        ))}
      </div>

      <div className="cc-plate">
        <table className="cc-table">
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
                  <td className="cc-mono cc-strong">{r.code}</td>
                  <td>
                    <div className="cc-strong">{r.tb}</div>
                    <div className="cc-sub">{r.kks}</div>
                  </td>
                  <td className="cc-mono cc-muted">{r.yc}</td>
                  <td className="cc-strong">{r.ld}</td>
                  <td>
                    <div className="cc-mono" style={{ fontSize: 11.5 }}>{r.start}</div>
                    <div className="cc-sub">DK kết thúc: {r.end}</div>
                  </td>
                  <td><Sign status={t.status} label={t.label} /></td>
                  <td>
                    <div className="cc-actions" style={{ justifyContent: 'flex-end' }}>
                      <button className="cc-btn cc-btn-icon" title="Xem chi tiết"><BsEye /></button>
                      <button className="cc-btn cc-btn-icon" disabled={done} title="Cập nhật trạng thái"><BsArrowRepeat /></button>
                      <button className="cc-btn cc-btn-icon" disabled={done} title="Sửa thông tin"><BsPencilSquare /></button>
                      <button className="cc-btn cc-btn-icon" disabled={done} title="Cấp vật tư"><BsBoxSeam /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="cc-pager">
        <button className="cc-btn cc-btn-sm" disabled>← Trước</button>
        <span className="cc-stencil">Trang 1 / 1 · {rows.length} phiếu</span>
        <button className="cc-btn cc-btn-sm" disabled>Sau →</button>
      </div>

      <div className="cc-foot">
        <span className="cc-stencil">Biểu mẫu PCT-01/SCMS · Lưu hồ sơ 05 năm</span>
        <span className="cc-stencil">Concept C — Thép &amp; Biển báo</span>
      </div>
    </>
  );
}

/* ============================================================
   KHUNG CONCEPT
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

export default function ConceptC() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="cc-root">
      <aside className="cc-side">
        <div className="cc-brand">
          <div className="cc-brand-name">SCMS</div>
          <div className="cc-brand-sub cc-stencil">Nhiệt điện · Sửa chữa</div>
        </div>

        {NAV.map((g) => (
          <div key={g.section}>
            <div className="cc-side-label">{g.section}</div>
            {g.items.map((it) => {
              const active = view === it.key;
              const live = it.key === 'dashboard' || it.key === 'workorders';
              return (
                <button
                  key={it.key}
                  className={`cc-nav-item ${active ? 'active' : ''}`}
                  onClick={() => live && setView(it.key)}
                  style={live ? undefined : { opacity: 0.4, cursor: 'default' }}
                  title={live ? undefined : 'Ngoài phạm vi bàn thử'}
                >
                  <span className="cc-nav-icon">{it.icon}</span>
                  {it.label}
                </button>
              );
            })}
          </div>
        ))}

        <div className="cc-side-foot cc-stencil">
          CONCEPT C<br />Thép &amp; Biển báo
        </div>
      </aside>

      <div className="cc-main">
        <header className="cc-topbar">
          <span className="cc-stencil">Bàn thử Phase 0 · Dữ liệu giả · Không phải bản chạy thật</span>
          <div className="cc-user">
            <div style={{ textAlign: 'right' }}>
              <div className="cc-user-name">Nguyễn Trung Hiếu</div>
              <div className="cc-stencil">Trưởng ca</div>
            </div>
            <div className="cc-avatar">NH</div>
          </div>
        </header>

        {/* Vạch cảnh báo — mép trên vùng nội dung, như vạch kẻ sàn nhà máy.
            Dùng ĐÚNG 2 chỗ trong cả concept (đây + ô "Sự cố khẩn"). Thêm nữa
            là thành trang trí, và vạch cảnh báo trang trí thì hết là cảnh báo. */}
        <div className="cc-hazard" />

        <main className="cc-content">
          {view === 'dashboard' ? <DashboardView /> : <WorkOrderView />}
        </main>
      </div>
    </div>
  );
}
