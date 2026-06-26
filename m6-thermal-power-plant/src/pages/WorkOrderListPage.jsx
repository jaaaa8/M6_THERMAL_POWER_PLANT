import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Table } from 'react-bootstrap';
import { BsFileEarmarkText, BsEye } from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import SearchBox from '../components/common/SearchBox';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  workOrderService,
  WO_STATUS_LABEL,
  WO_STATUS_VARIANT,
} from '../services/workOrderService';
import './WorkOrderListPage.css';

export default function WorkOrderListPage() {
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await workOrderService.getAll();
      setWorkOrders(res.data);
    } catch (err) {
      setError('Không thể tải danh sách phiếu công tác');
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  // Filter & Search
  const filteredOrders = useMemo(() => {
    let result = workOrders;

    if (filterStatus !== 'ALL') {
      result = result.filter((wo) => wo.trangThai === filterStatus);
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (wo) =>
          wo.maPhieu.toLowerCase().includes(q) ||
          wo.maKKS.toLowerCase().includes(q) ||
          wo.tenThietBi.toLowerCase().includes(q)
      );
    }

    return result;
  }, [workOrders, filterStatus, searchText]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div>
      <PageHeader
        title="Phiếu Công tác"
        subtitle="Danh sách tất cả phiếu công tác sửa chữa thiết bị"
        icon={<BsFileEarmarkText />}
      />

      {/* Toolbar */}
      <div className="wol-toolbar surface-card">
        <div className="wol-toolbar-left">
          <SearchBox
            placeholder="Tìm theo mã phiếu, mã KKS hoặc tên thiết bị..."
            value={searchText}
            onSearch={setSearchText}
          />
        </div>
        <div className="wol-toolbar-right">
          <Form.Select
            size="sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="wol-status-filter"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(WO_STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Form.Select>
          <span className="wol-result-count">
            {filteredOrders.length} phiếu
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="wol-error surface-card">
          <p className="text-danger">{error}</p>
          <Button variant="outline-primary" size="sm" onClick={loadWorkOrders}>
            Thử lại
          </Button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="surface-card" style={{ padding: 'var(--space-6)' }}>
          <EmptyState
            title="Không tìm thấy"
            message={
              searchText || filterStatus !== 'ALL'
                ? 'Không có phiếu công tác nào phù hợp với bộ lọc'
                : 'Chưa có phiếu công tác nào trong hệ thống.'
            }
          />
        </div>
      ) : (
        <div className="wol-table-wrapper surface-card">
          <div className="data-table-scroll">
            <Table hover className="data-table wol-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '14%' }}>Mã phiếu</th>
                  <th style={{ width: '12%' }}>Mã KKS</th>
                  <th style={{ width: '18%' }}>Thiết bị</th>
                  <th style={{ width: '18%' }}>Người chỉ huy</th>
                  <th style={{ width: '13%' }}>Trạng thái</th>
                  <th style={{ width: '12%' }}>Ngày tạo</th>
                  <th style={{ width: '8%' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((wo, idx) => (
                  <tr key={wo.id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <code className="code-tag">{wo.maPhieu}</code>
                    </td>
                    <td>
                      <code className="code-tag">{wo.maKKS}</code>
                    </td>
                    <td className="wol-cell-truncate" title={wo.tenThietBi}>
                      {wo.tenThietBi}
                    </td>
                    <td className="wol-cell-truncate" title={wo.nguoiChiHuy}>
                      {wo.nguoiChiHuy}
                    </td>
                    <td>
                      <StatusBadge
                        status={WO_STATUS_VARIANT[wo.trangThai]}
                        label={WO_STATUS_LABEL[wo.trangThai]}
                        pulse={wo.trangThai === 'DANG_MO'}
                      />
                    </td>
                    <td className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {formatDate(wo.ngayTao)}
                    </td>
                    <td>
                      <div className="data-table-actions">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/sua-chua/phieu-cong-tac/${wo.id}`)}
                          title="Xem chi tiết"
                        >
                          <BsEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
