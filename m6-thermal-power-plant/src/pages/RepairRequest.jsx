import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { workOrderService } from '../services/workOrderService';
import './RepairRequest.css';

/* ============================================================
   MAPS — Priority (RepairPriority enum) & Status (RepairRequestStatus enum)
   Values match the Java enums returned by RepairRequestDTO.
   ============================================================ */
const PRIORITY_MAP = {
  EMERGENCY: { label: 'Khẩn cấp', status: 'danger', pulse: true },
  HIGH:      { label: 'Ưu tiên cao', status: 'warning' },
  NORMAL:    { label: 'Bình thường', status: 'normal' },
  LOW:       { label: 'Bình thường', status: 'normal' },
};

const STATUS_MAP = {
  PENDING:     { label: 'Chờ xử lý', status: 'warning' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'info' },
  COMPLETED:   { label: 'Hoàn thành', status: 'normal' },
  REJECTED:    { label: 'Từ chối', status: 'inactive' },
};

/* ============================================================
   FILTER PILLS — dùng RepairRequestStatus enum values
   ============================================================ */
const FILTERS = [
  { key: 'PENDING', label: 'Chờ xử lý' },
  { key: 'ALL',     label: 'Tất cả' },
  { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { key: 'COMPLETED',   label: 'Hoàn thành' },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function RepairRequest() {
  // API data — requests come from GET /api/maintenance/repair-requests/pending
  // (endpoint only returns PENDING; we keep all fetched items in state so we can
  //  locally mark them IN_PROGRESS after creating a PCT, matching real status values)
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const [filter, setFilter]           = useState('PENDING');
  const [pctRequest, setPctRequest]   = useState(null);
  const [detailRequest, setDetailRequest] = useState(null);

  /* --- Fetch pending requests from backend --- */
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend returns PagedModel: { content: [...], page: { ... } }
      const res = await workOrderService.getPendingRequests(0, 100);
      setRequests(res.data.content ?? []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  /* --- Thống kê --- */
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'PENDING');
    return [
      { key: 'total',   label: 'Tổng yêu cầu',      value: requests.length, icon: <BsListUl />,            color: 'var(--color-primary-500)' },
      { key: 'pending', label: 'Đang chờ xử lý',     value: pending.length,  icon: <BsHourglassSplit />,    color: 'var(--color-status-warning)' },
      { key: 'pct',     label: 'Đang thực hiện',      value: requests.filter((r) => r.status === 'IN_PROGRESS').length, icon: <BsFileEarmarkCheck />, color: 'var(--color-status-info)' },
      { key: 'urgent',  label: 'Khẩn cấp (chờ)',      value: pending.filter((r) => r.priority === 'EMERGENCY').length, icon: <BsLightningChargeFill />, color: 'var(--color-status-danger)' },
    ];
  }, [requests]);

  /* --- Lọc theo trạng thái --- */
  const filtered = useMemo(() => {
    if (filter === 'ALL') return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  /* --- Cột bảng — dùng field names từ RepairRequestDTO --- */
  const columns = [
    { key: 'requestCode',    label: 'Mã YC',         mono: true, width: 130 },
    { key: 'equipmentName',  label: 'Thiết bị' },
    { key: 'equipmentKksCode', label: 'Mã KKS',      mono: true, width: 110 },
    {
      key: 'priority', label: 'Mức độ', width: 130,
      render: (val) => {
        const p = PRIORITY_MAP[val] || PRIORITY_MAP.NORMAL;
        return <StatusBadge status={p.status} label={p.label} pulse={p.pulse} />;
      },
    },
    { key: 'requesterName', label: 'Người yêu cầu' },
    {
      key: 'createdAt', label: 'Thời gian', width: 150,
      render: (val) => val ? new Date(val).toLocaleString('vi-VN') : '—',
    },
    {
      key: 'status', label: 'Trạng thái', width: 130,
      render: (val) => {
        const s = STATUS_MAP[val] || STATUS_MAP.PENDING;
        return <StatusBadge status={s.status} label={s.label} />;
      },
    },
  ];

  /* --- Khi tạo PCT thành công: đánh dấu request là IN_PROGRESS trên UI --- */
  const handlePCTCreated = (request) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'IN_PROGRESS' } : r))
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Yêu cầu Sửa chữa"
        subtitle="Tiếp nhận yêu cầu từ Trưởng ca / Trưởng kíp và lập phiếu công tác"
        icon={<BsExclamationTriangle />}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={fetchRequests} disabled={loading}>
            <BsArrowClockwise className="me-1" /> Làm mới
          </Button>
        }
      />

      {/* ===== ERROR ===== */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

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
            : requests.filter((r) => r.status === f.key).length;
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
        loading={loading}
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
            {row.status === 'PENDING' ? (
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
      {/* accountOptions: TODO — wire to GET /api/tai-khoan once that endpoint exists */}
      <ModalCreateWorkOrder
        show={!!pctRequest}
        request={pctRequest}
        accountOptions={[]}
        onClose={() => setPctRequest(null)}
        onCreated={handlePCTCreated}
      />

      {/* ===== MODAL: CHI TIẾT REQUEST ===== */}
      <RequestDetailModal request={detailRequest} onClose={() => setDetailRequest(null)} />
    </div>
  );
}

/* ============================================================
   Modal chi tiết yêu cầu (chỉ đọc) — dùng RepairRequestDTO field names
   ============================================================ */
function RequestDetailModal({ request, onClose }) {
  if (!request) return null;
  const p = PRIORITY_MAP[request.priority] || PRIORITY_MAP.NORMAL;
  const s = STATUS_MAP[request.status]     || STATUS_MAP.PENDING;

  return (
    <Modal show={!!request} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsCpu className="me-2" style={{ color: 'var(--color-primary-500)' }} />
          Chi tiết yêu cầu {request.requestCode}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="yc-detail-grid">
          <DetailRow label="Mã yêu cầu"   value={<span className="font-mono">{request.requestCode}</span>} />
          <DetailRow label="Trạng thái"    value={<StatusBadge status={s.status} label={s.label} />} />
          <DetailRow label="Thiết bị"      value={request.equipmentName} />
          <DetailRow label="Mã KKS"        value={<span className="font-mono">{request.equipmentKksCode}</span>} />
          <DetailRow label="Mức độ"        value={<StatusBadge status={p.status} label={p.label} pulse={p.pulse} />} />
          <DetailRow label="Người yêu cầu" value={request.requesterName || request.requesterUsername} />
          <DetailRow label="Thời gian"     value={request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '—'} />
        </div>
        <div className="yc-detail-desc">
          <span className="yc-detail-label">Mô tả hư hỏng</span>
          <p>{request.incidentDescription}</p>
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