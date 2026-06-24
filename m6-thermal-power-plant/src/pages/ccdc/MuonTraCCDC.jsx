import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import {
  BsArrowLeftRight, BsClipboardPlus, BsArrowClockwise, BsCheckLg, BsXLg,
  BsBoxArrowInLeft, BsHourglassSplit, BsExclamationTriangle, BsCheckCircle,
  BsClockHistory,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ToolRejectModal from '../../components/ccdc/ToolRejectModal';
import ToolReturnModal from '../../components/ccdc/ToolReturnModal';
import { toolBorrowLogService } from '../../services/toolService';
import { SAMPLE_BORROW_LOGS } from './sampleData';
import './MuonTraCCDC.css';

/* TODO: Lấy từ auth context khi có backend đăng nhập — mã tài khoản thủ kho hiện tại */
const CURRENT_ACCOUNT_ID = 1;

const STATUS_MAP = {
  PENDING: { label: 'Chờ duyệt', status: 'warning' },
  APPROVED: { label: 'Đã duyệt / đang mượn', status: 'info' },
  REJECTED: { label: 'Từ chối', status: 'inactive' },
  RETURNED: { label: 'Đã trả', status: 'normal' },
};

const FILTERS = [
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'ALL', label: 'Tất cả' },
  { key: 'APPROVED', label: 'Đang mượn' },
  { key: 'RETURNED', label: 'Đã trả' },
  { key: 'REJECTED', label: 'Từ chối' },
];

export default function MuonTraCCDC() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [filter, setFilter] = useState('PENDING');

  const [rejectLog, setRejectLog] = useState(null);
  const [returnLog, setReturnLog] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const logsRes = await toolBorrowLogService.search({});
      if (typeof logsRes.data !== 'object') {
        throw new Error('API trả về dữ liệu không hợp lệ (có thể chưa kết nối backend)');
      }
      const logPage = logsRes.data?.data;
      setLogs(logPage?.content ?? logPage ?? []);
      setUsingSampleData(false);
    } catch {
      setLogs(SAMPLE_BORROW_LOGS);
      setUsingSampleData(true);
      toast.info('Chưa kết nối được API — đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* --- Lọc theo trạng thái --- */
  const filtered = useMemo(() => {
    if (filter === 'ALL') return logs;
    return logs.filter((l) => l.status === filter);
  }, [logs, filter]);

  /* --- Thống kê --- */
  const stats = useMemo(() => {
    const pending = logs.filter((l) => l.status === 'PENDING');
    const approved = logs.filter((l) => l.status === 'APPROVED');
    const overdue = approved.filter((l) => l.overdue);
    const returned = logs.filter((l) => l.status === 'RETURNED');
    return [
      { key: 'pending', label: 'Chờ duyệt', value: pending.length, icon: <BsHourglassSplit />, color: 'var(--color-status-warning)' },
      { key: 'borrowing', label: 'Đang mượn', value: approved.length, icon: <BsArrowLeftRight />, color: 'var(--color-status-info)' },
      { key: 'overdue', label: 'Quá hạn chưa trả', value: overdue.length, icon: <BsExclamationTriangle />, color: 'var(--color-status-danger)' },
      { key: 'returned', label: 'Đã trả', value: returned.length, icon: <BsCheckCircle />, color: 'var(--color-status-normal)' },
    ];
  }, [logs]);

  /* --- Cột bảng --- */
  const columns = [
    { key: 'id', label: 'Mã mượn', width: 90, render: (val) => <span className="font-mono">PM-{val}</span> },
    { key: 'toolCode', label: 'Mã CCDC', mono: true, width: 120 },
    { key: 'toolName', label: 'Tên CCDC' },
    { key: 'quantity', label: 'SL', width: 60 },
    { key: 'accountName', label: 'Người mượn' },
    { key: 'transactionDate', label: 'Ngày mượn', width: 150 },
    {
      key: 'dueDate', label: 'Hạn trả', width: 150,
      render: (val, row) => (
        <span style={row.overdue ? { color: 'var(--color-status-danger)', fontWeight: 'var(--font-semibold)' } : undefined}>
          {val}
        </span>
      ),
    },
    {
      key: 'status', label: 'Trạng thái', width: 160,
      render: (val, row) => {
        const s = STATUS_MAP[val] || STATUS_MAP.PENDING;
        return (
          <>
            <StatusBadge status={s.status} label={s.label} />
            {row.overdue && (
              <span className="ccdc-overdue-tag"><BsClockHistory /> Quá hạn</span>
            )}
          </>
        );
      },
    },
  ];

  /* --- Handlers --- */
  const handleApprove = async (row) => {
    setApprovingId(row.id);
    try {
      await toolBorrowLogService.approve(row.id, CURRENT_ACCOUNT_ID);
      toast.success(`Đã duyệt và giao ${row.toolName} cho ${row.accountName}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể duyệt phiếu mượn');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mượn / Trả CCDC"
        subtitle={usingSampleData ? 'Đang xem dữ liệu mẫu (chưa kết nối API)' : 'Duyệt phiếu mượn, ghi nhận trả và theo dõi quá hạn'}
        icon={<BsArrowLeftRight />}
        actions={
          <>
            <Button variant="outline-secondary" size="sm" onClick={loadData}>
              <BsArrowClockwise className="me-1" /> Làm mới
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/ccdc/muon-tra/lap-phieu')}>
              <BsClipboardPlus className="me-1" /> Lập phiếu mượn
            </Button>
          </>
        }
      />

      {/* ===== STATS ===== */}
      <div className="ccdc-stats">
        {stats.map((s) => (
          <div key={s.key} className="ccdc-stat surface-card">
            <span className="ccdc-stat-icon" style={{ color: s.color }}>{s.icon}</span>
            <div className="ccdc-stat-body">
              <span className="ccdc-stat-value">{s.value}</span>
              <span className="ccdc-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== FILTER PILLS ===== */}
      <div className="ccdc-filter-pills">
        {FILTERS.map((f) => {
          const count = f.key === 'ALL' ? logs.length : logs.filter((l) => l.status === f.key).length;
          return (
            <button
              key={f.key}
              className={`ccdc-pill ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="ccdc-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ===== TABLE ===== */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Tìm theo mã CCDC, tên CCDC, người mượn..."
        pageSize={10}
        renderActions={(row) => (
          <div className="data-table-actions">
            {row.status === 'PENDING' && (
              <>
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={() => handleApprove(row)}
                  disabled={approvingId === row.id}
                  title="Duyệt và giao CCDC"
                >
                  <BsCheckLg />
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setRejectLog(row)}
                  title="Từ chối"
                >
                  <BsXLg />
                </button>
              </>
            )}
            {row.status === 'APPROVED' && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setReturnLog(row)}
                title="Xác nhận trả"
              >
                <BsBoxArrowInLeft className="me-1" /> Nhận trả
              </button>
            )}
            {(row.status === 'REJECTED' || row.status === 'RETURNED') && (
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>—</span>
            )}
          </div>
        )}
      />

      {/* ===== MODALS ===== */}
      <ToolRejectModal
        show={!!rejectLog}
        log={rejectLog}
        approvedByAccountId={CURRENT_ACCOUNT_ID}
        onClose={() => setRejectLog(null)}
        onSaved={loadData}
      />
      <ToolReturnModal
        show={!!returnLog}
        log={returnLog}
        onClose={() => setReturnLog(null)}
        onSaved={loadData}
      />
    </div>
  );
}
