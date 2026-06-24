import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Badge } from 'react-bootstrap';
import {
  BsClipboard2Check,
  BsPlayCircle,
  BsPauseCircle,
  BsLockFill,
  BsArrowLeft,
  BsGearWideConnected,
  BsPersonBadge,
  BsEye,
  BsCalendar3,
  BsPeople,
  BsClockHistory,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  workOrderService,
  WORK_ORDER_STATUS,
  WO_STATUS_LABEL,
  WO_STATUS_VARIANT,
} from '../services/workOrderService';
import { authService } from '../services/authService';
import './WorkOrderPage.css';

export default function WorkOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirm modal state
  const [confirmAction, setConfirmAction] = useState(null); // { status, title, message, variant }
  const [updating, setUpdating] = useState(false);

  // Current user role
  const currentUser = authService.getCurrentUser();
  const isTruongCa = currentUser?.role === 'TRUONG_CA' || currentUser?.role === 'ADMIN';

  // Load phiếu công tác
  const loadWorkOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await workOrderService.getById(id);
      setWorkOrder(res.data);
    } catch (err) {
      setError('Không tìm thấy phiếu công tác');
      toast.error('Lỗi tải phiếu công tác');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkOrder();
  }, [loadWorkOrder]);

  // Xử lý update trạng thái
  const handleUpdateStatus = async () => {
    if (!confirmAction) return;
    try {
      setUpdating(true);
      const res = await workOrderService.updateStatus(id, confirmAction.status);
      setWorkOrder(res.data);
      setConfirmAction(null);
      toast.success(`${confirmAction.title} thành công!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  // Format ngày giờ
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Phiếu Công tác" icon={<BsClipboard2Check />} />
        <LoadingSpinner />
      </div>
    );
  }

  // Error
  if (error || !workOrder) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Phiếu Công tác" icon={<BsClipboard2Check />} />
        <div className="wo-error surface-card">
          <p className="text-danger">{error || 'Không tìm thấy dữ liệu'}</p>
          <Button variant="outline-primary" size="sm" onClick={() => navigate('/sua-chua/yeu-cau')}>
            <BsArrowLeft className="me-1" /> Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const { trangThai } = workOrder;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Phiếu Công tác ${workOrder.maPhieu}`}
        subtitle="Quản lý chi tiết phiếu công tác sửa chữa thiết bị"
        icon={<BsClipboard2Check />}
        actions={
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate('/sua-chua/yeu-cau')}
          >
            <BsArrowLeft className="me-1" /> Quay lại
          </Button>
        }
      />

      {/* Status Banner */}
      <div className={`wo-status-banner wo-status-${WO_STATUS_VARIANT[trangThai]}`}>
        <div className="wo-status-banner-left">
          <StatusBadge
            status={WO_STATUS_VARIANT[trangThai]}
            label={WO_STATUS_LABEL[trangThai]}
            pulse={trangThai === WORK_ORDER_STATUS.DANG_THUC_HIEN}
          />
          <span className="wo-status-banner-text">
            {trangThai === WORK_ORDER_STATUS.CHUA_MO && 'Phiếu chưa được mở. Bấm "Mở phiếu" để bắt đầu công việc.'}
            {trangThai === WORK_ORDER_STATUS.DANG_THUC_HIEN && 'Đang tiến hành sửa chữa. Bấm "Đóng phiếu" khi tạm dừng cuối ngày.'}
            {trangThai === WORK_ORDER_STATUS.TAM_DUNG && 'Phiếu đã tạm dừng. Có thể mở lại hoặc nghiệm thu nếu hoàn thành.'}
            {trangThai === WORK_ORDER_STATUS.NGHIEM_THU && 'Phiếu đã được nghiệm thu và khóa. Không thể thay đổi trạng thái.'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {trangThai !== WORK_ORDER_STATUS.NGHIEM_THU && (
        <div className="wo-actions">
          {/* Nút Mở phiếu: hiện khi CHUA_MO hoặc TAM_DUNG */}
          {(trangThai === WORK_ORDER_STATUS.CHUA_MO || trangThai === WORK_ORDER_STATUS.TAM_DUNG) && (
            <Button
              variant="primary"
              className="wo-action-btn"
              onClick={() =>
                setConfirmAction({
                  status: WORK_ORDER_STATUS.DANG_THUC_HIEN,
                  title: 'Mở phiếu công tác',
                  message: 'Xác nhận mở phiếu và bắt đầu công việc sửa chữa? Trạng thái phiếu sẽ chuyển sang "Đang thực hiện".',
                  variant: 'primary',
                })
              }
            >
              <BsPlayCircle className="me-2" />
              Mở phiếu công tác
            </Button>
          )}

          {/* Nút Đóng phiếu: hiện khi DANG_THUC_HIEN */}
          {trangThai === WORK_ORDER_STATUS.DANG_THUC_HIEN && (
            <Button
              variant="warning"
              className="wo-action-btn"
              onClick={() =>
                setConfirmAction({
                  status: WORK_ORDER_STATUS.TAM_DUNG,
                  title: 'Đóng phiếu công tác',
                  message: 'Xác nhận đóng phiếu và tạm dừng công việc? Phiếu có thể được mở lại sau.',
                  variant: 'warning',
                })
              }
            >
              <BsPauseCircle className="me-2" />
              Đóng phiếu công tác
            </Button>
          )}

          {/* Nút Nghiệm thu: hiện khi TAM_DUNG, chỉ Trưởng ca mới bấm được */}
          {trangThai === WORK_ORDER_STATUS.TAM_DUNG && (
            <Button
              variant="success"
              className="wo-action-btn"
              disabled={!isTruongCa}
              title={!isTruongCa ? 'Chỉ Trưởng ca / Admin được phép nghiệm thu' : ''}
              onClick={() =>
                setConfirmAction({
                  status: WORK_ORDER_STATUS.NGHIEM_THU,
                  title: 'Khóa phiếu / Nghiệm thu',
                  message: 'Xác nhận nghiệm thu và khóa phiếu? Sau khi nghiệm thu, phiếu sẽ không thể thay đổi trạng thái.',
                  variant: 'primary',
                })
              }
            >
              <BsLockFill className="me-2" />
              Khóa phiếu / Nghiệm thu
              {!isTruongCa && (
                <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>
                  Chỉ Trưởng ca
                </Badge>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Info Cards */}
      <Row className="g-3 mb-4">
        {/* Thông tin thiết bị */}
        <Col lg={6} data-aos="fade-up">
          <Card className="wo-info-card">
            <Card.Header>
              <BsGearWideConnected className="me-2" style={{ color: 'var(--color-primary-600)' }} />
              Thông tin thiết bị
            </Card.Header>
            <Card.Body>
              <div className="wo-info-grid">
                <div className="wo-info-item">
                  <span className="wo-info-label">Mã KKS</span>
                  <code className="code-tag">{workOrder.maKKS}</code>
                </div>
                <div className="wo-info-item">
                  <span className="wo-info-label">Tên thiết bị</span>
                  <span className="wo-info-value">{workOrder.tenThietBi}</span>
                </div>
                <div className="wo-info-item wo-info-full">
                  <span className="wo-info-label">Mô tả công việc</span>
                  <span className="wo-info-value">{workOrder.moTaCongViec}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} data-aos="fade-up" data-aos-delay="100">
          <Card className="wo-info-card">
            <Card.Header>
              <BsPersonBadge className="me-2" style={{ color: 'var(--color-accent)' }} />
              Nhân sự phụ trách
            </Card.Header>
            <Card.Body>
              <div className="wo-info-grid">
                <div className="wo-info-item">
                  <span className="wo-info-label">Người chỉ huy</span>
                  <span className="wo-info-value">{workOrder.nguoiChiHuy}</span>
                </div>
                <div className="wo-info-item">
                  <span className="wo-info-label">Người giám sát</span>
                  <span className="wo-info-value">{workOrder.nguoiGiamSat}</span>
                </div>
                <div className="wo-info-item">
                  <span className="wo-info-label">Tổ trưởng</span>
                  <span className="wo-info-value">{workOrder.toTruong}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} data-aos="fade-up" data-aos-delay="200">
          <Card className="wo-info-card">
            <Card.Header>
              <BsCalendar3 className="me-2" style={{ color: 'var(--color-status-info)' }} />
              Thời gian
            </Card.Header>
            <Card.Body>
              <div className="wo-info-grid">
                <div className="wo-info-item">
                  <span className="wo-info-label">Ngày tạo phiếu</span>
                  <span className="wo-info-value">{formatDateTime(workOrder.ngayTao)}</span>
                </div>
                <div className="wo-info-item">
                  <span className="wo-info-label">Ngày bắt đầu</span>
                  <span className="wo-info-value">{formatDateTime(workOrder.ngayBatDau)}</span>
                </div>
                <div className="wo-info-item">
                  <span className="wo-info-label">Ngày kết thúc</span>
                  <span className="wo-info-value">{formatDateTime(workOrder.ngayKetThuc)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} data-aos="fade-up" data-aos-delay="300">
          <Card className="wo-info-card">
            <Card.Header>
              <BsPeople className="me-2" style={{ color: 'var(--color-status-normal)' }} />
              Thành viên tham gia ({workOrder.danhSachThanhVien?.length || 0})
            </Card.Header>
            <Card.Body>
              <div className="wo-member-list">
                {workOrder.danhSachThanhVien?.length > 0 ? (
                  workOrder.danhSachThanhVien.map((tv) => (
                    <div key={tv.id} className="wo-member-item">
                      <div className="wo-member-avatar">
                        {tv.hoTen.charAt(0)}
                      </div>
                      <div>
                        <div className="wo-member-name">{tv.hoTen}</div>
                        <div className="wo-member-role">{tv.chucVu}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
                    Chưa có thành viên nào
                  </p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Activity Timeline */}
      <Card className="wo-info-card mb-4" data-aos="fade-up" data-aos-delay="200">
        <Card.Header>
          <BsClockHistory className="me-2" style={{ color: 'var(--color-primary-600)' }} />
          Nhật ký hoạt động
        </Card.Header>
        <Card.Body>
          <div className="wo-timeline">
            {workOrder.nhatKy?.length > 0 ? (
              [...workOrder.nhatKy].reverse().map((log, idx) => (
                <div key={log.id} className={`wo-timeline-item ${idx === 0 ? 'latest' : ''}`}>
                  <div className="wo-timeline-dot" />
                  <div className="wo-timeline-content">
                    <div className="wo-timeline-header">
                      <strong>{log.hanhDong}</strong>
                      <span className="wo-timeline-time">{formatDateTime(log.thoiGian)}</span>
                    </div>
                    <p className="wo-timeline-text">
                      {log.ghiChu}
                    </p>
                    <span className="wo-timeline-user">{log.nguoiThucHien}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Chưa có nhật ký</p>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Confirm Modal */}
      <ConfirmModal
        show={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleUpdateStatus}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText="Xác nhận"
        variant={confirmAction?.variant || 'primary'}
        loading={updating}
      />
    </div>
  );
}
