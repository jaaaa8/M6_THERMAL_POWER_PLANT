import { useState, useEffect, useCallback } from 'react';
import { Button } from 'react-bootstrap';
import { BsClipboardCheck, BsArrowClockwise } from 'react-icons/bs';
import PageHeader from '../common/PageHeader';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import WorkOrderDetailModal from '../work_order/WorkOrderDetailModal';
import { workOrderService } from '../../services/workOrderService';
import { toast } from 'react-toastify';
import '../work_order/WorkOrderList.css';

const TRANG_THAI_MAP = {
  STOPPED: { label: 'Tạm dừng', status: 'inactive' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
};

export default function LubricationWorkOrderList() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const pageSize = 20;

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workOrderService.getAll({ type: 'LUBRICATION' }, page, pageSize);
      const paged = res.data;
      const content = Array.isArray(paged.content) ? paged.content : [];
      setWorkOrders(content);
      setTotalPages(paged.page?.totalPages ?? 1);
    } catch (err) {
      toast.error('Không thể tải danh sách phiếu bôi trơn');
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const columns = [
    { key: 'orderCode', label: 'Mã PCT', mono: true, width: 160 },
    {
      key: 'equipmentName', label: 'Thiết bị',
      render: (_, row) => {
        const equipments = Array.isArray(row.equipments) ? row.equipments : [];
        if (!equipments.length) return '—';
        const shown = equipments.slice(0, 3);
        const rest = equipments.length - shown.length;
        return (
          <div>
            {shown.map((e) => (
              <div key={e.id}>
                <span style={{ fontWeight: 'var(--font-semibold)' }}>{e.name}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginLeft: 6 }}>
                  {e.kksCode}
                </span>
              </div>
            ))}
            {rest > 0 && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                +{rest} thiết bị khác
              </div>
            )}
          </div>
        );
      },
    },
    { key: 'repairDescription', label: 'Mô tả', render: (v) => v || '—' },
    {
      key: 'startTime', label: 'Thời gian', width: 170,
      render: (val, row) => (
        <div>
          <div>{val ? new Date(val).toLocaleString('vi-VN') : '—'}</div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Kết thúc: {row.endTime ? new Date(row.endTime).toLocaleString('vi-VN') : '—'}
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

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Phiếu công tác bảo dưỡng dầu mỡ"
        subtitle="Danh sách PCT bôi trơn tạo từ checklist"
        icon={<BsClipboardCheck />}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={fetchWorkOrders}>
            <BsArrowClockwise className="me-1" /> Làm mới
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : workOrders.length === 0 ? (
        <EmptyState
          icon={<BsClipboardCheck />}
          title="Không có phiếu bôi trơn nào"
          description="Chưa có PCT bôi trơn nào được tạo từ checklist."
        />
      ) : (
        <>
          <DataTable columns={columns} data={workOrders} renderActions={(row) => (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setSelectedWorkOrderId(row.id)}
            >
              Xem chi tiết
            </Button>
          )} />
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

      <WorkOrderDetailModal
        show={!!selectedWorkOrderId}
        workOrderId={selectedWorkOrderId}
        onClose={() => setSelectedWorkOrderId(null)}
        onChanged={fetchWorkOrders}
      />
    </div>
  );
}
