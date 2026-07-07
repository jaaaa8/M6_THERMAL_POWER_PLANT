import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from 'react-bootstrap';
import {
  BsClipboardCheck, BsSearch, BsArrowClockwise, BsListUl,
  BsHourglassSplit, BsCheckCircle, BsPlayCircle,
  BsEye, BsBoxSeam, BsPrinter, BsPencilSquare, BsArrowRepeat,
} from 'react-icons/bs';
import PageHeader from '../common/PageHeader';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import SearchBox from '../common/SearchBox';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import WorkOrderDetailModal from './WorkOrderDetailModal';
import WorkOrderEditModal from './WorkOrderEditModal';
import WorkOrderStatusModal from './WorkOrderStatusModal';
import SuppliesIssueModal from './SuppliesIssueModal';
import { workOrderService } from '../../services/workOrderService';
import { authService } from '../../services/authService';
import { isTerminalStatus, openPdfBlob, blobErrorMessage } from './pdfUtils';
import { toast } from 'react-toastify';
import './WorkOrderList.css';

/* ============================================================
   MAP — Trạng thái PCT
   ============================================================ */
const TRANG_THAI_MAP = {
  OPEN: { label: 'Chờ duyệt', status: 'info' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  WAITING_FOR_APPROVAL: { label: 'Chờ duyệt gia hạn', status: 'warning' },
  APPROVED: { label: 'Đã duyệt', status: 'info' },
  STOPPED: { label: 'Tạm dừng', status: 'inactive' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
};

/* ============================================================
   FILTER PILLS
   ============================================================ */
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

/**
 * Gating vai trò (chỉ ở UI, backend không chặn — nhất quán các nút cũ):
 * nút Sửa dành cho người vận hành; nút Trạng thái mở cho cả người vận hành
 * lẫn người duyệt (modal tự lọc option theo vai trò).
 */
const OPERATE_ROLES = ['TEAM_LEADER', 'ADMIN'];
const APPROVE_ROLES = ['SHIFT_LEADER', 'WORKSHOP_FOREMAN', 'ADMIN'];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function WorkOrderList({ title = "Phiếu Công tác" }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [suppliesIssueTarget, setSuppliesIssueTarget] = useState(null);
  const [printingIssueId, setPrintingIssueId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);     // dòng đang sửa thông tin
  const [statusTarget, setStatusTarget] = useState(null); // dòng đang đổi trạng thái
  const pageSize = 20;

  const userRoles = authService.getCurrentUser()?.roles || [];
  const canOperate = userRoles.some((r) => OPERATE_ROLES.includes(r));
  const canChangeStatus = canOperate || userRoles.some((r) => APPROVE_ROLES.includes(r));

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
      { key: 'open', label: 'Chờ duyệt', value: open, icon: <BsHourglassSplit />, color: 'var(--color-status-info)' },
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
      key: 'startTime', label: 'Thời gian', width: 170,
      render: (val, row) => (
        <div>
          <div>{val ? new Date(val).toLocaleString('vi-VN') : '—'}</div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Dự kiến kết thúc: {row.expectedEndTime ? new Date(row.expectedEndTime).toLocaleString('vi-VN') : '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'status', label: 'Trạng thái', width: 140,
      render: (val) => {
        const t = TRANG_THAI_MAP[val] || { label: val, status: 'info' };
        return <StatusBadge status={t.status} label={t.label} />;
      },
    },
  ];

  /* --- In phiếu đề nghị cấp phát vật tư (PDF, mở tab mới) --- */
  const handlePrintSuppliesIssue = async (row) => {
    // Phiếu đã kết thúc → mở thẳng bản lưu đóng băng, khỏi render lại.
    if (isTerminalStatus(row.status) && row.suppliesPdfPath) {
      window.open(row.suppliesPdfPath, '_blank');
      return;
    }
    setPrintingIssueId(row.id);
    try {
      const res = await workOrderService.exportSuppliesIssuePdf(row.id);
      openPdfBlob(res.data);
    } catch (err) {
      toast.error(`Không thể in phiếu cấp vật tư: ${await blobErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setPrintingIssueId(null);
    }
  };

  /* --- Hành động dòng --- */
  function renderActions(row) {
    const finished = row.status === 'COMPLETED' || row.status === 'CANCELLED';
    return (
      <div className="d-flex gap-1">
        <Button
          variant="outline-primary"
          size="sm"
          title="Xem chi tiết"
          onClick={() => setSelectedWorkOrderId(row.id)}
        >
          <BsEye className="me-1" /> Xem
        </Button>
        {canChangeStatus && (
          <Button
            variant="outline-warning"
            size="sm"
            title={finished ? 'Phiếu đã chốt — không thể chuyển trạng thái' : 'Cập nhật trạng thái phiếu (duyệt / bắt đầu / tạm dừng / hoàn thành / huỷ)'}
            disabled={finished}
            onClick={() => setStatusTarget(row)}
          >
            <BsArrowRepeat className="me-1" /> Trạng thái
          </Button>
        )}
        {canOperate && (
          <Button
            variant="outline-info"
            size="sm"
            title={finished ? 'Phiếu đã chốt — không thể sửa' : 'Sửa thông tin phiếu (nhân sự, thời gian, mô tả)'}
            disabled={finished}
            onClick={() => setEditTarget(row)}
          >
            <BsPencilSquare className="me-1" /> Sửa
          </Button>
        )}
        <Button
          variant="outline-success"
          size="sm"
          title={finished ? 'PCT đã kết thúc — không thể cấp vật tư' : 'Cấp vật tư cho PCT'}
          disabled={finished}
          onClick={() => setSuppliesIssueTarget(row)}
        >
          <BsBoxSeam className="me-1" /> Cấp vật tư
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          title="In phiếu đề nghị cấp phát vật tư (PDF)"
          disabled={printingIssueId === row.id}
          onClick={() => handlePrintSuppliesIssue(row)}
        >
          <BsPrinter className="me-1" /> {printingIssueId === row.id ? 'Đang in...' : 'In VT'}
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={title}
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
          <DataTable columns={columns} data={filtered} renderActions={renderActions} actionColumnWidth={550} />
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

      {/* ===== MODAL: CHI TIẾT PCT ===== */}
      <WorkOrderDetailModal
        show={!!selectedWorkOrderId}
        workOrderId={selectedWorkOrderId}
        onClose={() => setSelectedWorkOrderId(null)}
        onChanged={fetchWorkOrders}
      />

      {/* ===== MODAL: CẤP VẬT TƯ CHO PCT ===== */}
      <SuppliesIssueModal
        show={!!suppliesIssueTarget}
        workOrder={suppliesIssueTarget}
        onClose={() => setSuppliesIssueTarget(null)}
      />

      {/* ===== MODAL: CẬP NHẬT TRẠNG THÁI PCT =====
          key theo id → mỗi phiếu là một instance mới, state trong modal tự sạch */}
      <WorkOrderStatusModal
        key={`status-${statusTarget?.id ?? 'none'}`}
        show={!!statusTarget}
        workOrder={statusTarget}
        onClose={() => setStatusTarget(null)}
        onChanged={fetchWorkOrders}
      />

      {/* ===== MODAL: SỬA THÔNG TIN PCT ===== */}
      <WorkOrderEditModal
        key={`edit-${editTarget?.id ?? 'none'}`}
        show={!!editTarget}
        workOrder={editTarget}
        onClose={() => setEditTarget(null)}
        onChanged={fetchWorkOrders}
      />
    </div>
  );
}