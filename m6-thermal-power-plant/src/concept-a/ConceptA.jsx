/* ============================================================
   CONCEPT A — "Phòng điều khiển" (Control Room)
   BÀN THỬ Phase 0 — KHÔNG phải code sản xuất, KHÔNG gọi API.

   Dựng lại Dashboard + WorkOrderList để so trực tiếp với Concept B
   ("Hồ sơ kỹ thuật"). Cùng dữ liệu, cùng nội dung, cùng hai màn — chỉ
   khác ngôn ngữ thị giác. So được thì mới chọn được.

   ponytail: dữ liệu giả nhân bản từ concept-b thay vì tách file dùng
   chung. Cố ý — hai concept phải xoá được độc lập; khi B thua thì
   `rm -rf src/concept-b/` không được làm A chết theo. Ghép hai bản
   nháp vào nhau để tiết kiệm 40 dòng literal là sai chiều đánh đổi.

   Xoá thư mục này + 2 dòng route trong App.jsx là sạch dấu vết.
   ============================================================ */

import { useState, useMemo } from 'react';
import {
  BsGrid1X2, BsClipboardCheck, BsCpu, BsBoxSeam, BsDropletHalf,
  BsExclamationTriangle, BsFileEarmarkText, BsSearch, BsEye,
  BsArrowRepeat, BsPencilSquare, BsPeople, BsTools,
} from 'react-icons/bs';
import './ConceptA.css';

/* ============================================================
   DỮ LIỆU GIẢ — khớp concept-b để so sánh công bằng
   ============================================================ */

const DASH_STATS = [
  { label: 'Thiết bị', unit: 'TỔNG', value: 247, delta: '+3', dir: 'up', fill: 0.92, tone: 'var(--ca-inactive)' },
  { label: 'Đang sửa chữa', unit: 'PCT', value: 12, delta: '+2', dir: 'up', fill: 0.28, tone: 'var(--ca-info)' },
  { label: 'Yêu cầu chờ', unit: 'PYC', value: 5, delta: '−1', dir: 'down', fill: 0.16, tone: 'var(--ca-warning)' },
  { label: 'Sự cố khẩn', unit: 'ALARM', value: 2, delta: '+1', dir: 'up', fill: 0.08, tone: 'var(--ca-danger)' },
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

const SCALE_TICKS = 22;

/* ============================================================
   MẢNH GHÉP
   ============================================================ */

function Lamp({ status, label }) {
  return (
    <span className={`ca-lamp ${status}`}>
      <span className="ca-lamp-text">{label}</span>
    </span>
  );
}

function Gauge({ label, unit, value, delta, dir, fill, tone }) {
  const lit = Math.max(1, Math.round(fill * SCALE_TICKS));
  return (
    <div className="ca-gauge">
      <div className="ca-gauge-head">
        <span className="ca-engrave">{label}</span>
        <span className="ca-engrave">{unit}</span>
      </div>
      <div className="ca-readout">
        <span className="ca-readout-value">{String(value).padStart(3, '0')}</span>
        {delta && (
          <span className="ca-readout-delta" style={{ color: dir === 'up' ? 'var(--ca-danger)' : 'var(--ca-normal)' }}>
            {delta}
          </span>
        )}
      </div>
      <div className="ca-scale" style={{ color: tone }}>
        {Array.from({ length: SCALE_TICKS }, (_, i) => (
          <i key={i} className={i < lit ? 'lit' : undefined} />
        ))}
      </div>
    </div>
  );
}

function Panel({ title, action, children, bodyPad = true }) {
  return (
    <section className="ca-panel">
      <header className="ca-panel-head">
        <span className="ca-engrave">{title}</span>
        {action}
      </header>
      <div className={bodyPad ? 'ca-panel-body' : undefined}>{children}</div>
    </section>
  );
}

function PageHead({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="ca-pagehead">
      <div>
        <div className="ca-engrave">{eyebrow}</div>
        <h1 className="ca-title">{title}</h1>
        {subtitle && <p className="ca-subtitle">{subtitle}</p>}
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
        actions={<span className="ca-engrave">Ca trực 19/06/2026 · 07:00–19:00</span>}
      />

      <div className="ca-gauges">
        {DASH_STATS.map((s) => <Gauge key={s.label} {...s} />)}
      </div>

      <div className="ca-grid">
        <Panel
          title="Yêu cầu sửa chữa gần đây"
          action={<button className="ca-btn ca-btn-sm">Xem tất cả</button>}
          bodyPad={false}
        >
          <table className="ca-table">
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
                  <td className="ca-mono ca-strong">{r.ma}</td>
                  <td>{r.tb}</td>
                  <td className="ca-mono ca-muted">{r.kks}</td>
                  <td><Lamp status={r.mucDo} label={r.mucDoLabel} /></td>
                  <td className="ca-mono ca-muted">{r.ngay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div style={{ display: 'grid', gap: 12 }}>
          <Panel title="Trạng thái thiết bị">
            {EQUIPMENT_STATUS.map((e) => (
              <div key={e.label} className="ca-eq-row">
                <Lamp status={e.status} label={e.label} />
                <span className="ca-eq-count">{e.count}</span>
              </div>
            ))}
            <div className="ca-bar">
              {EQUIPMENT_STATUS.map((e) => (
                <i
                  key={e.label}
                  title={`${e.label}: ${e.count}`}
                  style={{ width: `${(e.count / total) * 100}%`, background: `var(--ca-${e.status})` }}
                />
              ))}
            </div>
            <div className="ca-total">
              <span className="ca-engrave">Tổng cộng {total} thiết bị</span>
            </div>
          </Panel>

          <Panel title="Truy cập nhanh">
            <div className="ca-qa">
              {QUICK_ACTIONS.map((a) => (
                <button key={a.code} className="ca-qa-btn">
                  <span className="ca-qa-icon">{a.icon}</span>
                  <span>{a.label}</span>
                  <span className="ca-engrave">{a.code}</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="ca-foot">
        <span className="ca-engrave">SCMS · Hệ thống Quản lý Sửa chữa &amp; Bảo dưỡng</span>
        <span className="ca-engrave">Concept A — Phòng điều khiển</span>
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

  const gauges = [
    { label: 'Tổng PCT', unit: 'ALL', value: WORK_ORDERS.length, fill: 1, tone: 'var(--ca-inactive)' },
    { label: 'Chờ duyệt', unit: 'OPEN', value: countOf('OPEN'), fill: countOf('OPEN') / WORK_ORDERS.length, tone: 'var(--ca-info)' },
    { label: 'Đang thực hiện', unit: 'RUN', value: countOf('IN_PROGRESS'), fill: countOf('IN_PROGRESS') / WORK_ORDERS.length, tone: 'var(--ca-warning)' },
    { label: 'Hoàn thành', unit: 'DONE', value: countOf('COMPLETED'), fill: countOf('COMPLETED') / WORK_ORDERS.length, tone: 'var(--ca-normal)' },
  ];

  return (
    <>
      <PageHead
        eyebrow="SCMS / Sửa chữa"
        title="Phiếu công tác"
        subtitle="Danh sách phiếu công tác (PCT) được tạo từ yêu cầu sửa chữa"
        actions={<button className="ca-btn ca-btn-sm">Làm mới</button>}
      />

      <div className="ca-gauges">
        {gauges.map((g) => <Gauge key={g.label} {...g} />)}
      </div>

      <div className="ca-toolbar">
        <label className="ca-search">
          <BsSearch style={{ color: 'var(--ca-text-3)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã PCT, mã yêu cầu hoặc nội dung..."
          />
        </label>
        <button className="ca-btn">Lập phiếu công tác</button>
      </div>

      <div className="ca-switches">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`ca-switch ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="ca-switch-count">{countOf(f.key)}</span>
          </button>
        ))}
      </div>

      <div className="ca-panel">
        <table className="ca-table">
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
                  <td className="ca-mono ca-strong">{r.code}</td>
                  <td>
                    <div className="ca-strong">{r.tb}</div>
                    <div className="ca-sub">{r.kks}</div>
                  </td>
                  <td className="ca-mono ca-muted">{r.yc}</td>
                  <td>{r.ld}</td>
                  <td>
                    <div className="ca-mono" style={{ fontSize: 11.5 }}>{r.start}</div>
                    <div className="ca-sub">DK kết thúc: {r.end}</div>
                  </td>
                  <td><Lamp status={t.status} label={t.label} /></td>
                  <td>
                    <div className="ca-actions" style={{ justifyContent: 'flex-end' }}>
                      <button className="ca-btn ca-btn-icon" title="Xem chi tiết"><BsEye /></button>
                      <button className="ca-btn ca-btn-icon" disabled={done} title="Cập nhật trạng thái"><BsArrowRepeat /></button>
                      <button className="ca-btn ca-btn-icon" disabled={done} title="Sửa thông tin"><BsPencilSquare /></button>
                      <button className="ca-btn ca-btn-icon" disabled={done} title="Cấp vật tư"><BsBoxSeam /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ca-pager">
        <button className="ca-btn ca-btn-sm" disabled>← Trước</button>
        <span className="ca-engrave">Trang 1 / 1 · {rows.length} phiếu</span>
        <button className="ca-btn ca-btn-sm" disabled>Sau →</button>
      </div>

      <div className="ca-foot">
        <span className="ca-engrave">Biểu mẫu PCT-01/SCMS · Lưu hồ sơ 05 năm</span>
        <span className="ca-engrave">Concept A — Phòng điều khiển</span>
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

export default function ConceptA() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="ca-root">
      <aside className="ca-side">
        <div className="ca-brand">
          <div className="ca-brand-name">SCMS</div>
          <div className="ca-brand-sub ca-engrave">Nhiệt điện · Sửa chữa</div>
        </div>

        {NAV.map((g) => (
          <div key={g.section} className="ca-side-group">
            <div className="ca-side-label ca-engrave">{g.section}</div>
            {g.items.map((it) => {
              const active = view === it.key;
              const live = it.key === 'dashboard' || it.key === 'workorders';
              return (
                <button
                  key={it.key}
                  className={`ca-nav-item ${active ? 'active' : ''}`}
                  onClick={() => live && setView(it.key)}
                  style={live ? undefined : { opacity: 0.4, cursor: 'default' }}
                  title={live ? undefined : 'Ngoài phạm vi bàn thử'}
                >
                  <span className="ca-nav-icon">{it.icon}</span>
                  {it.label}
                </button>
              );
            })}
          </div>
        ))}

        <div className="ca-side-foot ca-engrave">
          CONCEPT A<br />Phòng điều khiển
        </div>
      </aside>

      <div className="ca-main">
        <header className="ca-topbar">
          <div className="ca-topbar-left">
            <span className="ca-lamp normal"><span className="ca-lamp-text">Hệ thống bình thường</span></span>
            <span className="ca-topbar-sep" />
            <span className="ca-engrave">Bàn thử Phase 0 · Dữ liệu giả · Không phải bản chạy thật</span>
          </div>
          <div className="ca-user">
            <div style={{ textAlign: 'right' }}>
              <div className="ca-user-name">Nguyễn Trung Hiếu</div>
              <div className="ca-engrave">Trưởng ca</div>
            </div>
            <div className="ca-avatar">NH</div>
          </div>
        </header>

        <main className="ca-content">
          {view === 'dashboard' ? <DashboardView /> : <WorkOrderView />}
        </main>
      </div>
    </div>
  );
}
