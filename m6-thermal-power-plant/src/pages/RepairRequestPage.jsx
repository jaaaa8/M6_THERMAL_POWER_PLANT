import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { BsWrenchAdjustable, BsPlusLg, BsEye, BsTrash } from 'react-icons/bs';
import { toast } from 'react-toastify';
import AOS from 'aos';
import PageHeader from '../components/common/PageHeader';
import SearchBox from '../components/common/SearchBox';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';
import CreateRequestModal from '../components/requests/CreateRequestModal';
import RequestDetailModal from '../components/requests/RequestDetailModal';
import {
  repairRequestService,
  REQUEST_STATUS,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_VARIANT,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
} from '../services/repairRequestService';
import { authService } from '../services/authService';
import './RepairRequestPage.css';

export default function RepairRequestPage() {
  // Người dùng hiện tại (để lọc "yêu cầu của tôi")
  const currentUserName = authService.getCurrentUser()?.hoTen || '';

  // Data state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchKKS, setSearchKKS] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [onlyMine, setOnlyMine] = useState(true); // Mặc định: chỉ yêu cầu mình tạo

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      setTimeout(() => AOS.refresh(), 100);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Danh sách trong phạm vi (theo bộ lọc "của tôi") — dùng để đếm & lọc tiếp
  const scopedRequests = useMemo(() => {
    if (onlyMine && currentUserName) {
      return requests.filter((r) => r.nguoiTao === currentUserName);
    }
    return requests;
  }, [requests, onlyMine, currentUserName]);

  // Số yêu cầu đang chờ xử lý trong phạm vi
  const pendingCount = useMemo(
    () => scopedRequests.filter((r) => r.trangThai === REQUEST_STATUS.CHO_DUYET).length,
    [scopedRequests]
  );

  // Filter & Search
  const filteredRequests = useMemo(() => {
    let result = scopedRequests;

    // Filter theo trạng thái
    if (filterStatus !== 'ALL') {
      result = result.filter((r) => r.trangThai === filterStatus);
    }

    // Search theo mã KKS
    if (searchKKS.trim()) {
      const q = searchKKS.toLowerCase();
      result = result.filter(
        (r) =>
          r.maKKS.toLowerCase().includes(q) ||
          r.tenThietBi.toLowerCase().includes(q)
      );
    }

    return result;
  }, [scopedRequests, filterStatus, searchKKS]);

  // Bật/tắt nhanh bộ lọc "Đang chờ xử lý"
  const togglePending = () => {
    setFilterStatus((prev) =>
      prev === REQUEST_STATUS.CHO_DUYET ? 'ALL' : REQUEST_STATUS.CHO_DUYET
    );
  };

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

  // Xử lý sau khi tạo mới thành công
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
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
    <div className="animate-fade-in">
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

      {/* Toolbar: Search + Filter */}
      <div className="rr-toolbar surface-card" data-aos="fade-up">
        <div className="rr-toolbar-left">
          <SearchBox
            placeholder="Tìm theo mã KKS hoặc tên thiết bị..."
            value={searchKKS}
            onSearch={setSearchKKS}
          />
        </div>
        <div className="rr-toolbar-right">
          {/* Quick filter: Đang chờ xử lý */}
          <button
            type="button"
            className={`rr-quick-chip ${filterStatus === REQUEST_STATUS.CHO_DUYET ? 'active' : ''}`}
            onClick={togglePending}
            title="Lọc nhanh các yêu cầu đang chờ xử lý"
          >
            Đang chờ xử lý
            <span className="rr-quick-count">{pendingCount}</span>
          </button>

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
        <div className="rr-table-wrapper surface-card" data-aos="fade-up" data-aos-delay="100">
          <div className="data-table-scroll">
            <Table hover className="data-table rr-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th style={{ width: 100 }}>Mã KKS</th>
                  <th>Thiết bị</th>
                  <th>Mô tả sự cố</th>
                  <th style={{ width: 110 }}>Ưu tiên</th>
                  <th style={{ width: 130 }}>Trạng thái</th>
                  <th style={{ width: 145 }}>Ngày tạo</th>
                  <th style={{ width: 120 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, idx) => (
                  <tr key={req.id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <code className="code-tag">{req.maKKS}</code>
                    </td>
                    <td className="text-truncate" style={{ maxWidth: 180 }}>
                      {req.tenThietBi}
                    </td>
                    <td className="text-truncate" style={{ maxWidth: 250 }}>
                      {req.moTaSuCo}
                    </td>
                    <td>
                      <span
                        className="rr-priority-badge"
                        style={{
                          '--priority-color': PRIORITY_COLOR[req.mucDoUuTien],
                        }}
                      >
                        {PRIORITY_LABEL[req.mucDoUuTien]}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={REQUEST_STATUS_VARIANT[req.trangThai]}
                        label={REQUEST_STATUS_LABEL[req.trangThai]}
                        pulse={req.mucDoUuTien === 'KHAN_CAP' && req.trangThai !== 'HOAN_THANH'}
                      />
                    </td>
                    <td className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {formatDate(req.ngayTao)}
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
                        {req.trangThai === REQUEST_STATUS.CHO_DUYET && (
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

      {/* Create Request Modal */}
      <CreateRequestModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Detail Modal (read-only) — Phiếu yêu cầu KHÁC Phiếu công tác */}
      <RequestDetailModal
        request={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        show={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá yêu cầu sửa chữa"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn xoá yêu cầu cho thiết bị "${deleteTarget.tenThietBi}" (${deleteTarget.maKKS})? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmText="Xoá"
        loading={deleting}
      />
    </div>
  );
}
