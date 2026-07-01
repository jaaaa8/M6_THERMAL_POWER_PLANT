import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import {
  BsWrenchAdjustable, BsPlusLg, BsEye, BsTrash,
  BsPencilSquare, BsCheckCircle, BsXCircle, BsFileEarmarkPlus,
  BsListUl, BsHourglassSplit, BsFileEarmarkCheck, BsLightningChargeFill,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import SearchBox from '../components/common/SearchBox';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';
import CreateRequestModal from '../components/requests/CreateRequestModal';
import CreateWorkOrderModal from '../components/requests/CreateWorkOrderModal';
import RequestDetailModal from '../components/requests/RequestDetailModal';
import {
  repairRequestService,
  REQUEST_STATUS,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_VARIANT,
  PRIORITY,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
} from '../services/repairRequestService';
import { authService } from '../services/authService';
import './RepairRequestPage.css';

// Pill nhanh cho các trạng thái dùng nhiều (TU_CHOI vẫn truy cập qua dropdown)
const FILTER_PILLS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: REQUEST_STATUS.CHO_DUYET, label: 'Chờ duyệt' },
  { key: REQUEST_STATUS.DA_DUYET, label: 'Đã duyệt' },
  { key: REQUEST_STATUS.DANG_XU_LY, label: 'Đang xử lý' },
  { key: REQUEST_STATUS.HOAN_THANH, label: 'Hoàn thành' },
];

// Vai trò được duyệt/từ chối yêu cầu sửa chữa
const APPROVER_ROLES = ['ADMIN', 'REPAIR_MANAGER'];
// Vai trò được tạo PCT từ yêu cầu đã duyệt
const PCT_CREATOR_ROLES = ['ADMIN', 'REPAIR_MANAGER', 'TEAM_LEADER'];

export default function RepairRequestPage() {
  const currentUser = authService.getCurrentUser();
  const currentUserName = currentUser?.fullName || '';
  const currentUserRole = currentUser?.role || '';

  const canApprove = APPROVER_ROLES.includes(currentUserRole);
  const canCreatePCT = PCT_CREATOR_ROLES.includes(currentUserRole);

  // Data state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchKKS, setSearchKKS] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [onlyMine, setOnlyMine] = useState(true);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [pctTarget, setPctTarget] = useState(null);

  // Load danh sách yêu cầu
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await repairRequestService.getAll();
      setRequests(res.data);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu sửa chữa');
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Danh sách trong phạm vi (theo bộ lọc "của tôi") — dùng để đếm & lọc tiếp
  const scopedRequests = useMemo(() => {
    if (onlyMine && currentUserName) {
      return requests.filter((r) => r.createdBy === currentUserName);
    }
    return requests;
  }, [requests, onlyMine, currentUserName]);

  // Đếm theo từng pill — phụ thuộc scopedRequests (đã áp "của tôi")
  const pillCounts = useMemo(() => {
    const counts = { ALL: scopedRequests.length };
    FILTER_PILLS.forEach((p) => {
      if (p.key !== 'ALL') {
        counts[p.key] = scopedRequests.filter((r) => r.status === p.key).length;
      }
    });
    return counts;
  }, [scopedRequests]);

  // Thống kê hiển thị 4 thẻ tóm tắt
  const stats = useMemo(() => {
    const choDuyet = scopedRequests.filter((r) => r.status === REQUEST_STATUS.CHO_DUYET);
    return [
      {
        key: 'total',
        label: onlyMine ? 'Yêu cầu của tôi' : 'Tổng yêu cầu',
        value: scopedRequests.length,
        icon: <BsListUl />,
        color: 'var(--color-primary-500)',
      },
      {
        key: 'pending',
        label: 'Đang chờ duyệt',
        value: choDuyet.length,
        icon: <BsHourglassSplit />,
        color: 'var(--color-status-warning)',
      },
      {
        key: 'approved',
        label: 'Đã duyệt',
        value: scopedRequests.filter((r) => r.status === REQUEST_STATUS.DA_DUYET).length,
        icon: <BsFileEarmarkCheck />,
        color: 'var(--color-status-info)',
      },
      {
        key: 'urgent',
        label: 'Khẩn cấp (chờ duyệt)',
        value: choDuyet.filter((r) => r.priority === PRIORITY.KHAN_CAP).length,
        icon: <BsLightningChargeFill />,
        color: 'var(--color-status-danger)',
      },
    ];
  }, [scopedRequests, onlyMine]);

  // Filter & Search
  const filteredRequests = useMemo(() => {
    let result = scopedRequests;

    // Filter theo trạng thái
    if (filterStatus !== 'ALL') {
      result = result.filter((r) => r.status === filterStatus);
    }

    // Search theo mã KKS
    if (searchKKS.trim()) {
      const q = searchKKS.toLowerCase();
      result = result.filter(
        (r) =>
          r.kksCode.toLowerCase().includes(q) ||
          r.equipmentName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [scopedRequests, filterStatus, searchKKS]);

  // Xử lý xóa
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await repairRequestService.remove(deleteTarget.id);
      toast.success('Xoá yêu cầu thành công!');
      setDeleteTarget(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xoá yêu cầu');
    } finally {
      setDeleting(false);
    }
  };

  // Duyệt yêu cầu
  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      setApproving(true);
      await repairRequestService.approve(approveTarget.id);
      toast.success(`Đã duyệt yêu cầu [${approveTarget.kksCode}]`);
      setApproveTarget(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể duyệt yêu cầu');
    } finally {
      setApproving(false);
    }
  };

  // Từ chối yêu cầu
  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      setRejecting(true);
      await repairRequestService.reject(rejectTarget.id);
      toast.success(`Đã từ chối yêu cầu [${rejectTarget.kksCode}]`);
      setRejectTarget(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể từ chối yêu cầu');
    } finally {
      setRejecting(false);
    }
  };

  // Xử lý sau khi tạo mới / sửa thành công
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setEditTarget(null);
    loadRequests();
  };

  // Format ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <PageHeader
        title="Yêu cầu Sửa chữa"
        subtitle="Quản lý các yêu cầu sửa chữa thiết bị trong nhà máy"
        icon={<BsWrenchAdjustable />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <BsPlusLg className="me-1" /> Tạo mới
          </Button>
        }
      />

      {/* Stats summary */}
      <div className="rr-stats">
        {stats.map((s) => (
          <div key={s.key} className="rr-stat surface-card">
            <span className="rr-stat-icon" style={{ color: s.color }}>{s.icon}</span>
            <div className="rr-stat-body">
              <span className="rr-stat-value">{s.value}</span>
              <span className="rr-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills (truy cập nhanh các trạng thái thường dùng) */}
      <div className="rr-filter-pills">
        {FILTER_PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`rr-pill ${filterStatus === p.key ? 'active' : ''}`}
            onClick={() => setFilterStatus(p.key)}
          >
            {p.label}
            <span className="rr-pill-count">{pillCounts[p.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Toolbar: Search + Filter */}
      <div className="rr-toolbar surface-card">
        <div className="rr-toolbar-left">
          <SearchBox
            placeholder="Tìm theo mã KKS hoặc tên thiết bị..."
            value={searchKKS}
            onSearch={setSearchKKS}
          />
        </div>
        <div className="rr-toolbar-right">
          {/* Switch: Chỉ yêu cầu của tôi */}
          <Form.Check
            type="switch"
            id="rr-only-mine"
            label="Của tôi"
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
            className="rr-only-mine"
          />

          <Form.Select
            size="sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rr-status-filter"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(REQUEST_STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Form.Select>
          <span className="rr-result-count">
            {filteredRequests.length} kết quả
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="rr-error surface-card">
          <p className="text-danger">{error}</p>
          <Button variant="outline-primary" size="sm" onClick={loadRequests}>
            Thử lại
          </Button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="surface-card" style={{ padding: 'var(--space-6)' }}>
          <EmptyState
            title="Không tìm thấy"
            message={
              searchKKS || filterStatus !== 'ALL' || onlyMine
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
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '15%' }}>Mã KKS</th>
                  <th style={{ width: '22%' }}>Thiết bị</th>
                  <th style={{ width: '16%' }}>Ưu tiên</th>
                  <th style={{ width: '16%' }}>Trạng thái</th>
                  <th style={{ width: '16%' }}>Ngày tạo</th>
                  <th style={{ width: '10%' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, idx) => (
                  <tr key={req.id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <code className="code-tag">{req.kksCode}</code>
                    </td>
                    <td className="rr-cell-truncate" title={req.equipmentName}>
                      {req.equipmentName}
                    </td>
                    <td>
                      <span
                        className="rr-priority-badge"
                        style={{
                          '--priority-color': PRIORITY_COLOR[req.priority],
                        }}
                      >
                        {PRIORITY_LABEL[req.priority]}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={REQUEST_STATUS_VARIANT[req.status]}
                        label={REQUEST_STATUS_LABEL[req.status]}
                        pulse={req.priority === 'KHAN_CAP' && req.status !== 'HOAN_THANH'}
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
                        {/* Sửa: chỉ khi CHO_DUYET và là người tạo */}
                        {req.status === REQUEST_STATUS.CHO_DUYET && req.createdBy === currentUserName && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => setEditTarget(req)}
                            title="Sửa"
                          >
                            <BsPencilSquare />
                          </button>
                        )}
                        {/* Duyệt / Từ chối: chỉ khi CHO_DUYET và user có quyền */}
                        {req.status === REQUEST_STATUS.CHO_DUYET && canApprove && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => setApproveTarget(req)}
                              title="Duyệt"
                            >
                              <BsCheckCircle />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setRejectTarget(req)}
                              title="Từ chối"
                            >
                              <BsXCircle />
                            </button>
                          </>
                        )}
                        {/* Tạo PCT: chỉ khi DA_DUYET và user có quyền */}
                        {req.status === REQUEST_STATUS.DA_DUYET && canCreatePCT && (
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => setPctTarget(req)}
                            title="Tạo Phiếu công tác"
                          >
                            <BsFileEarmarkPlus />
                          </button>
                        )}
                        {/* Xóa: chỉ khi CHO_DUYET */}
                        {req.status === REQUEST_STATUS.CHO_DUYET && (
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
        </div>
      )}

      {/* Create / Edit Request Modal */}
      <CreateRequestModal
        show={showCreateModal || !!editTarget}
        onClose={() => { setShowCreateModal(false); setEditTarget(null); }}
        onSuccess={handleCreateSuccess}
        editRequest={editTarget}
      />

      {/* Detail Modal (read-only) */}
      <RequestDetailModal
        request={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      {/* Approve Confirm Modal */}
      <ConfirmModal
        show={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Duyệt yêu cầu sửa chữa"
        message={
          approveTarget
            ? `Duyệt yêu cầu cho thiết bị "${approveTarget.equipmentName}" (${approveTarget.kksCode})? Sau khi duyệt, yêu cầu sẽ chuyển sang trạng thái "Đã duyệt" và có thể tạo Phiếu công tác.`
            : ''
        }
        confirmText="Duyệt"
        variant="primary"
        loading={approving}
      />

      {/* Reject Confirm Modal */}
      <ConfirmModal
        show={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        title="Từ chối yêu cầu sửa chữa"
        message={
          rejectTarget
            ? `Từ chối yêu cầu cho thiết bị "${rejectTarget.equipmentName}" (${rejectTarget.kksCode})? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmText="Từ chối"
        loading={rejecting}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        show={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá yêu cầu sửa chữa"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn xoá yêu cầu cho thiết bị "${deleteTarget.equipmentName}" (${deleteTarget.kksCode})? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmText="Xoá"
        loading={deleting}
      />

      {/* Tạo Phiếu Công tác từ Yêu cầu */}
      <CreateWorkOrderModal
        show={!!pctTarget}
        request={pctTarget}
        onClose={() => setPctTarget(null)}
        onCreated={() => {
          setPctTarget(null);
          loadRequests();
        }}
      />
    </div>
  );
}
