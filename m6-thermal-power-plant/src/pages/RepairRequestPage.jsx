import { useState, useEffect, useCallback } from 'react';
import { Button, Form, Table, Modal } from 'react-bootstrap';
import {
  BsWrenchAdjustable, BsPlusLg, BsEye, BsTrash,
  BsFileEarmarkPlus, BsCpu,
  BsListUl, BsHourglassSplit, BsFileEarmarkCheck, BsLightningChargeFill,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import SearchBox from '../components/common/SearchBox';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';
import PaginationPanel from '../components/equipment/PaginationPanel';
import CreateRequestModal from '../components/repair_request/CreateRequestModal';
import CreateWorkOrderModal from '../components/repair_request/CreateWorkOrderModal';
import {
  repairRequestService,
  REQUEST_STATUS,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_VARIANT,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
} from '../services/repairRequestService';
import { getApiErrorMessage } from '../services/apiError';
import { authService } from '../services/authService';
import './RepairRequestPage.css';

const FILTER_PILLS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: REQUEST_STATUS.PENDING, label: 'Chờ xử lý' },
  { key: REQUEST_STATUS.APPROVED, label: 'Đã duyệt' },
  { key: REQUEST_STATUS.IN_PROGRESS, label: 'Đang xử lý' },
  { key: REQUEST_STATUS.COMPLETED, label: 'Hoàn thành' },
];

// Map key stats trả về từ backend cho từng pill (ALL/status).
const STAT_KEY_BY_STATUS = {
  ALL: 'total',
  [REQUEST_STATUS.PENDING]: 'pending',
  [REQUEST_STATUS.APPROVED]: 'approved',
  [REQUEST_STATUS.IN_PROGRESS]: 'inProgress',
  [REQUEST_STATUS.COMPLETED]: 'completed',
};

export function RequestDetailModal({ request, onClose }) {
  if (!request) return null;
  return (
    <Modal show={!!request} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsCpu className="me-2" style={{ color: 'var(--color-primary)' }} />
          Chi tiết yêu cầu {request.requestCode}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="yc-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="yc-detail-item">
            <span className="yc-detail-label text-muted d-block" style={{ fontSize: 'var(--text-xs)' }}>Mã yêu cầu</span>
            <span className="yc-detail-value font-mono">{request.requestCode}</span>
          </div>
          <div className="yc-detail-item">
            <span className="yc-detail-label text-muted d-block" style={{ fontSize: 'var(--text-xs)' }}>Trạng thái</span>
            <span className="yc-detail-value"><StatusBadge status={REQUEST_STATUS_VARIANT[request.status] || 'warning'} label={REQUEST_STATUS_LABEL[request.status] || request.status} /></span>
          </div>
          <div className="yc-detail-item">
            <span className="yc-detail-label text-muted d-block" style={{ fontSize: 'var(--text-xs)' }}>Thiết bị</span>
            <span className="yc-detail-value">{request.equipmentName}</span>
          </div>
          <div className="yc-detail-item">
            <span className="yc-detail-label text-muted d-block" style={{ fontSize: 'var(--text-xs)' }}>Mã KKS</span>
            <span className="yc-detail-value font-mono">{request.equipmentKksCode}</span>
          </div>
          <div className="yc-detail-item">
            <span className="yc-detail-label text-muted d-block" style={{ fontSize: 'var(--text-xs)' }}>Mức độ</span>
            <span className="yc-detail-value">{PRIORITY_LABEL[request.priority]}</span>
          </div>
          <div className="yc-detail-item">
            <span className="yc-detail-label text-muted d-block" style={{ fontSize: 'var(--text-xs)' }}>Người yêu cầu</span>
            <span className="yc-detail-value">{request.requesterName}</span>
          </div>
          <div className="yc-detail-item">
            <span className="yc-detail-label text-muted d-block" style={{ fontSize: 'var(--text-xs)' }}>Thời gian</span>
            <span className="yc-detail-value">{request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '—'}</span>
          </div>
        </div>
        <div className="yc-detail-desc" style={{ marginTop: '1.5rem' }}>
          <span className="yc-detail-label text-muted d-block" style={{ fontSize: 'var(--text-xs)', marginBottom: '0.5rem' }}>Mô tả sự cố</span>
          <p style={{ background: 'var(--color-surface-container)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{request.incidentDescription}</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function RepairRequestPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vai trò: chỉ SL/CL mới tạo mới / xoá yêu cầu sửa chữa.
  // MF/TL chỉ xem danh sách + tạo PCT từ request pending.
  const userRoles = authService.getCurrentUser()?.roles || [];
  const canManageRequest = userRoles.some((r) =>
    ['SHIFT_LEADER', 'CREW_LEADER', 'ADMIN'].includes(r)
  );

  // Phân trang server-side (0-based, khớp Spring Page)
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Bộ lọc
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Số liệu tổng hợp (đếm toàn bộ) cho stat cards + pill counts
  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, inProgress: 0, completed: 0, emergencyPending: 0,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pctTarget, setPctTarget] = useState(null);

  const fetchData = useCallback(async (
    status = filterStatus,
    priority = filterPriority,
    search = searchQuery,
    pageNumber = page,
    pageSize = size,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const res = await repairRequestService.getList({
        status: status === 'ALL' ? undefined : status,
        priority: priority || undefined,
        search,
        page: pageNumber,
        size: pageSize,
      });
      const d = res.data || {};
      setRequests(d.content || []);
      setTotalElements(d.totalElements ?? (d.page?.totalElements ?? 0));
      setTotalPages(d.totalPages ?? (d.page?.totalPages ?? 0));
      setPage(d.number ?? (d.page?.number ?? pageNumber));
      setSize(d.size ?? (d.page?.size ?? pageSize));
    } catch {
      setError('Không thể tải danh sách yêu cầu sửa chữa');
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await repairRequestService.getStats();
      setStats(res.data || {});
    } catch {
      // Không chặn UI nếu stats lỗi — danh sách vẫn dùng được.
    }
  }, []);

  useEffect(() => {
    fetchData('ALL', '', '', 0, size);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đổi bộ lọc → luôn quay về trang 0
  const applyStatus = (status) => {
    setFilterStatus(status);
    fetchData(status, filterPriority, searchQuery, 0, size);
  };
  const applyPriority = (priority) => {
    setFilterPriority(priority);
    fetchData(filterStatus, priority, searchQuery, 0, size);
  };
  const applySearch = (q) => {
    setSearchQuery(q);
    fetchData(filterStatus, filterPriority, q, 0, size);
  };

  const refresh = () => {
    fetchData(filterStatus, filterPriority, searchQuery, page, size);
    fetchStats();
  };

  const statCards = [
    { key: 'total', label: 'Tổng yêu cầu', value: stats.total, icon: <BsListUl />, color: 'var(--color-primary)' },
    { key: 'pending', label: 'Đang chờ xử lý', value: stats.pending, icon: <BsHourglassSplit />, color: 'var(--color-status-warning)' },
    { key: 'in_progress', label: 'Đang thực hiện', value: stats.inProgress, icon: <BsFileEarmarkCheck />, color: 'var(--color-status-info)' },
    { key: 'urgent', label: 'Khẩn cấp (chờ xử lý)', value: stats.emergencyPending, icon: <BsLightningChargeFill />, color: 'var(--color-status-danger)' },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await repairRequestService.remove(deleteTarget.id);
      toast.success('Xoá yêu cầu thành công!');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xoá yêu cầu'));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchData(filterStatus, filterPriority, searchQuery, 0, size);
    fetchStats();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Yêu cầu Sửa chữa"
        subtitle="Quản lý các yêu cầu sửa chữa thiết bị trong nhà máy"
        icon={<BsWrenchAdjustable />}
        actions={
          canManageRequest && (
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              <BsPlusLg className="me-1" /> Tạo mới
            </Button>
          )
        }
      />

      <div className="rr-stats">
        {statCards.map((s) => (
          <div key={s.key} className="rr-stat surface-card">
            <span className="rr-stat-icon" style={{ color: s.color }}>{s.icon}</span>
            <div className="rr-stat-body">
              <span className="rr-stat-value">{s.value ?? 0}</span>
              <span className="rr-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rr-filter-pills">
        {FILTER_PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`rr-pill ${filterStatus === p.key ? 'active' : ''}`}
            onClick={() => applyStatus(p.key)}
          >
            {p.label}
            <span className="rr-pill-count">{stats[STAT_KEY_BY_STATUS[p.key]] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="rr-toolbar surface-card">
        <div className="rr-toolbar-left">
          <SearchBox
            placeholder="Tìm theo mã YC, KKS hoặc tên thiết bị..."
            value={searchQuery}
            onSearch={applySearch}
          />
        </div>
        <div className="rr-toolbar-right">
          <Form.Select
            size="sm"
            value={filterStatus}
            onChange={(e) => applyStatus(e.target.value)}
            className="rr-status-filter"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(REQUEST_STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Form.Select>
          <Form.Select
            size="sm"
            value={filterPriority}
            onChange={(e) => applyPriority(e.target.value)}
            className="rr-status-filter"
          >
            <option value="">Tất cả mức độ</option>
            {Object.entries(PRIORITY_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Form.Select>
          <span className="rr-result-count">{totalElements} kết quả</span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="rr-error surface-card">
          <p className="text-danger">{error}</p>
          <Button variant="outline-primary" size="sm" onClick={refresh}>Thử lại</Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="surface-card" style={{ padding: 'var(--space-6)' }}>
          <EmptyState
            title="Không tìm thấy"
            message={
              searchQuery || filterStatus !== 'ALL' || filterPriority
                ? 'Không có yêu cầu nào phù hợp với bộ lọc'
                : 'Chưa có yêu cầu sửa chữa nào. Bấm "Tạo mới" để bắt đầu.'
            }
          />
        </div>
      ) : (
        <div className="rr-table-wrapper surface-card">
          <div className="data-table-scroll">
            <Table hover className="data-table rr-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Mã YC</th>
                  <th style={{ width: '15%' }}>Mã KKS</th>
                  <th style={{ width: '25%' }}>Thiết bị</th>
                  <th style={{ width: '12%' }}>Ưu tiên</th>
                  <th style={{ width: '12%' }}>Trạng thái</th>
                  <th style={{ width: '15%' }}>Ngày tạo</th>
                  <th style={{ width: '11%' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <code className="code-tag">{req.requestCode}</code>
                    </td>
                    <td>
                      <code className="code-tag">{req.equipmentKksCode}</code>
                    </td>
                    <td className="rr-cell-truncate" title={req.equipmentName}>
                      {req.equipmentName}
                    </td>
                    <td>
                      <span
                        className="rr-priority-badge"
                        style={{ '--priority-color': PRIORITY_COLOR[req.priority] || PRIORITY_COLOR.NORMAL }}
                      >
                        {PRIORITY_LABEL[req.priority] || req.priority}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={REQUEST_STATUS_VARIANT[req.status] || 'warning'}
                        label={REQUEST_STATUS_LABEL[req.status] || req.status}
                        pulse={req.priority === 'EMERGENCY' && req.status === 'PENDING'}
                      />
                    </td>
                    <td className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {formatDate(req.createdAt)}
                    </td>
                    <td>
                      <div className="data-table-actions">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setDetailTarget(req)}
                          title="Xem chi tiết"
                        >
                          <BsEye />
                        </button>
                        {req.status === REQUEST_STATUS.PENDING && (
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => setPctTarget(req)}
                            title="Tạo Phiếu công tác"
                          >
                            <BsFileEarmarkPlus />
                          </button>
                        )}
                        {req.status === REQUEST_STATUS.PENDING && canManageRequest && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteTarget(req)}
                            title="Xoá"
                          >
                            <BsTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <PaginationPanel
            page={page}
            size={size}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={(newPage) => fetchData(filterStatus, filterPriority, searchQuery, newPage, size)}
            onSizeChange={(newSize) => {
              setSize(newSize);
              fetchData(filterStatus, filterPriority, searchQuery, 0, newSize);
            }}
          />
        </div>
      )}

      <CreateRequestModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <RequestDetailModal
        request={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      <ConfirmModal
        show={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá yêu cầu sửa chữa"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn xoá yêu cầu cho thiết bị "${deleteTarget.equipmentName}" (${deleteTarget.equipmentKksCode})? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmText="Xoá"
        loading={deleting}
      />

      <CreateWorkOrderModal
        show={!!pctTarget}
        request={pctTarget}
        onClose={() => setPctTarget(null)}
        onCreated={() => {
          setPctTarget(null);
          refresh();
        }}
      />
    </div>
  );
}
