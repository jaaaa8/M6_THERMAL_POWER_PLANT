import { Modal, Button } from 'react-bootstrap';
import { BsExclamationTriangle } from 'react-icons/bs';

/**
 * ConfirmModal — Dialog xác nhận hành động nguy hiểm (xoá, huỷ, khoá...).
 * 
 * @param {object} props
 * @param {boolean} props.show - Hiển thị modal
 * @param {Function} props.onClose - Đóng modal
 * @param {Function} props.onConfirm - Xác nhận hành động
 * @param {string} [props.title='Xác nhận'] - Tiêu đề
 * @param {string} [props.message] - Nội dung thông báo
 * @param {string} [props.confirmText='Xác nhận'] - Text nút xác nhận
 * @param {string} [props.cancelText='Huỷ'] - Text nút huỷ
 * @param {'danger'|'warning'|'primary'} [props.variant='danger'] - Kiểu nút
 * @param {boolean} [props.loading=false] - Đang xử lý
 */
export default function ConfirmModal({
  show,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsExclamationTriangle
            className="me-2"
            style={{ color: variant === 'danger' ? 'var(--color-status-danger)' : 'var(--color-status-warning)' }}
          />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          {message}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} disabled={loading}>
          {loading ? 'Đang xử lý...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
