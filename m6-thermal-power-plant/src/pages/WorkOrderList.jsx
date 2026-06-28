import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from 'react-bootstrap';
import {
  BsClipboardCheck, BsSearch, BsArrowClockwise, BsListUl,
  BsHourglassSplit, BsCheckCircle, BsXCircle, BsPlayCircle,
  BsEye,
} from 'react-icons/bs';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBox from '../components/common/SearchBox';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { workOrderService } from '../services/workOrderService';
import { toast } from 'react-toastify';
import './WorkOrderList.css';

/* ============================================================
   MAP — Trạng thái PCT
   ============================================================ */
const TRANG_THAI_MAP = {
  OPEN: { label: 'Mới tạo', status: 'info' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
};

/* ============================================================
   FILTER PILLS
   ============================================================ */
const FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'OPEN', label: 'Mới tạo' },
  { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã huỷ' },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function WorkOrderList() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  /* --- Fetch dữ liệu --- */
  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workOrderService.getAll(search || undefined, page, pageSize);
      const paged = res.data;
      const content = Array.isArray(paged.content) ? paged.content : [];
      setWorkOrders(content);
      setTotalPages(paged.page?.totalPages ?? 1);
      setTotalElements(paged.page?.totalElements ?? content.length);
    } catch (err) {
      toast.error('Không thể tải danh sách phiếu công tác');
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  /* --- Thống kê (từ dữ liệu đã tải + totalElements) --- */
  const stats = useMemo(() => {
    const open = workOrders.filter((r) => r.status === 'OPEN').length;
    const inProgress = workOrders.filter((r) => r.status === 'IN_PROGRESS').length;
    const completed = workOrders.filter((r) => r.status === 'COMPLETED').length;
    const cancelled = workOrders.filter((r) => r.status === 'CANCELLED').length;
    return [
      { key: 'total', label: 'Tổng PCT', value: totalElements, icon: <BsListUl />, color: 'var(--color-primary-500)' },
      { key: 'open', label: 'Mới tạo', value: open, icon: <BsHourglassSplit />, color: 'var(--color-status-info)' },
      { key: 'in_progress', label: 'Đang thực hiện', value: inProgress, icon: <BsPlayCircle />, color: 'var(--color-status-warning)' },
      { key: 'completed', label: 'Hoàn thành', value: completed, icon: <BsCheckCircle />, color: 'var(--color-status-normal)' },
    ];
  }, [workOrders, totalElements]);

  /* --- Lọc theo trạng thái --- */
  const filtered = useMemo(() => {
    if (filter === 'ALL') return workOrders;
    return workOrders.filter((r) => r.status === filter);
  }, [workOrders, filter]);

  /* --- Cột bảng --- */
  const columns = [
    { key: 'orderCode', label: 'Mã PCT', mono: true, width: 160 },
    {
      key: 'equipmentName', label: 'Thiết bị',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-semibold)' }}>{row.equipmentName}</div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {row.equipmentKksCode}
          </span>
        </div>
      ),
    },
    { key: 'requestCode', label: 'Mã YC', mono: true, width: 130 },
    { key: 'leaderName', label: 'Người LĐ', width: 150 },
    {
      key: 'startTime', label: 'Bắt đầu', width: 150,
      render: (val) => val ? new Date(val).toLocaleString('vi-VN') : '—',
    },
    {
      key: 'status', label: 'Trạng thái', width: 140,
      render: (val) => {
        const t = TRANG_THAI_MAP[val] || { label: val, status: 'info' };
        return <StatusBadge status={t.status} label={t.label} />;
      },
    },
  ];

  /* --- Hành động dòng --- */
  function renderActions(row) {
    return (
      <Button
        variant="outline-primary"
        size="sm"
        title="Xem chi tiết"
        onClick={() => toast.info(`Chi tiết PCT ${row.orderCode} — đang phát triển`)}
      >
        <BsEye className="me-1" /> Xem
      </Button>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Phiếu Công tác"
        subtitle="Danh sách phiếu công tác (PCT) được tạo từ yêu cầu sửa chữa"
        icon={<BsClipboardCheck />}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={fetchWorkOrders}>
            <BsArrowClockwise className="me-1" /> Làm mới
          </Button>
        }
      />

      {/* ===== STATS ===== */}
      <div className="wo-stats">
        {stats.map((s) => (
          <div key={s.key} className="wo-stat surface-card">
            <span className="wo-stat-icon" style={{ color: s.color }}>{s.icon}</span>
            <div className="wo-stat-body">
              <span className="wo-stat-value">{s.value}</span>
              <span className="wo-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== SEARCH + FILTERS ===== */}
      <div className="wo-toolbar">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo mã PCT, mã yêu cầu hoặc nội dung..."
          onSearch={() => { setPage(0); fetchWorkOrders(); }}
          icon={<BsSearch />}
        />
      </div>

      <div className="wo-filter-pills">
        {FILTERS.map((f) => {
          const count = f.key === 'ALL'
            ? totalElements
            : workOrders.filter((r) => r.status === f.key).length;
          return (
            <button
              key={f.key}
              className={`wo-pill ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="wo-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ===== TABLE ===== */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BsClipboardCheck />}
          title="Không có phiếu công tác nào"
          description={search ? 'Thử từ khoá khác hoặc xoá bộ lọc.' : 'Chưa có PCT nào được tạo.'}
        />
      ) : (
        <>
          <DataTable columns={columns} data={filtered} actions={renderActions} />
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="wo-pagination">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                ← Trước
              </Button>
              <span className="wo-page-info">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Sau →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}