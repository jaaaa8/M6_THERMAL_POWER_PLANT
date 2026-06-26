import { Modal, Button } from 'react-bootstrap';
import { BsInfoCircle, BsCalendar3, BsPersonBadge } from 'react-icons/bs';
import StatusBadge from '../common/StatusBadge';
import {
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_VARIANT,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
} from '../../services/repairRequestService';
import './RequestDetailModal.css';

/**
 * RequestDetailModal — Xem chi tiết một Phiếu yêu cầu sửa chữa (chỉ đọc).
 *
 * Lưu ý nghiệp vụ: Phiếu yêu cầu (PYC) chỉ ghi nhận sự cố, KHÁC với
 * Phiếu công tác (PCT). Modal này không điều hướng sang PCT.
 *
 * @param {object} props
 * @param {object|null} props.request - Yêu cầu cần xem; null để ẩn modal
 * @param {Function} props.onClose
 */
export default function RequestDetailModal({ request, onClose }) {
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

  return (
    <Modal show={!!request} onHide={onClose} centered size="lg" className="request-detail-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsInfoCircle className="me-2" style={{ color: 'var(--color-primary-600)' }} />
          Chi tiết Phiếu yêu cầu sửa chữa
        </Modal.Title>
      </Modal.Header>

      {request && (
        <Modal.Body>
          {/* Thiết bị */}
          <section className="rdm-section">
            <h6 className="rdm-section-title">
              <BsInfoCircle className="me-2" style={{ color: 'var(--color-primary-600)' }} />
              Thông tin sự cố
            </h6>
            <div className="rdm-grid">
              <div className="rdm-item">
                <span className="rdm-label">Mã KKS</span>
                <code className="code-tag">{request.maKKS}</code>
              </div>
              <div className="rdm-item">
                <span className="rdm-label">Thiết bị</span>
                <span className="rdm-value">{request.tenThietBi}</span>
              </div>
              <div className="rdm-item">
                <span className="rdm-label">Mức độ ưu tiên</span>
                <span
                  className="rdm-priority"
                  style={{ '--priority-color': PRIORITY_COLOR[request.mucDoUuTien] }}
                >
                  {PRIORITY_LABEL[request.mucDoUuTien]}
                </span>
              </div>
              <div className="rdm-item">
                <span className="rdm-label">Trạng thái</span>
                <StatusBadge
                  status={REQUEST_STATUS_VARIANT[request.trangThai]}
                  label={REQUEST_STATUS_LABEL[request.trangThai]}
                />
              </div>
              <div className="rdm-item rdm-item-full">
                <span className="rdm-label">Mô tả sự cố</span>
                <p className="rdm-description">{request.moTaSuCo}</p>
              </div>
            </div>
          </section>

          {/* Người tạo & thời gian */}
          <section className="rdm-section">
            <h6 className="rdm-section-title">
              <BsPersonBadge className="me-2" style={{ color: 'var(--color-accent)' }} />
              Ghi nhận
            </h6>
            <div className="rdm-grid">
              <div className="rdm-item">
                <span className="rdm-label">Người tạo</span>
                <span className="rdm-value">{request.nguoiTao}</span>
              </div>
              <div className="rdm-item">
                <span className="rdm-label">
                  <BsCalendar3 className="me-1" /> Ngày tạo
                </span>
                <span className="rdm-value">{formatDateTime(request.ngayTao)}</span>
              </div>
            </div>
          </section>
        </Modal.Body>
      )}

      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
