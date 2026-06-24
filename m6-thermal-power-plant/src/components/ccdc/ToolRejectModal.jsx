import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { BsXOctagon, BsSave, BsXCircle } from 'react-icons/bs';
import { toolBorrowLogService } from '../../services/toolService';

const validationSchema = Yup.object({
  reason: Yup.string().required('Vui lòng nhập lý do từ chối').max(500, 'Lý do quá dài'),
});

/**
 * ToolRejectModal — Thủ kho từ chối phiếu mượn CCDC.
 *
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Function} props.onSaved
 * @param {object|null} props.log
 * @param {number} props.approvedByAccountId
 */
export default function ToolRejectModal({ show, onClose, onSaved, log, approvedByAccountId }) {
  if (!log) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Formik
        initialValues={{ reason: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            const res = await toolBorrowLogService.reject(log.id, approvedByAccountId, { reason: values.reason });
            toast.success('Đã từ chối phiếu mượn');
            onSaved?.(res.data?.data);
            resetForm();
            onClose?.();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form noValidate>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
                <BsXOctagon className="me-2" style={{ color: 'var(--color-status-danger)' }} />
                Từ chối phiếu mượn
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {log.toolName} ({log.toolCode}) · {log.accountName} mượn {log.quantity}
              </p>
              <div className="mb-1">
                <label htmlFor="reject-reason" className="form-label">
                  Lý do từ chối <span className="required-asterisk">*</span>
                </label>
                <Field
                  as="textarea"
                  id="reject-reason"
                  name="reason"
                  rows={3}
                  autoFocus
                  className={`form-control ${touched.reason && errors.reason ? 'is-invalid' : ''}`}
                  placeholder="VD: Hết hàng khả dụng, mục đích mượn không hợp lệ..."
                />
                <ErrorMessage name="reason" component="div" className="invalid-feedback" />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
                <BsXCircle /> Đóng
              </Button>
              <Button variant="danger" size="sm" type="submit" disabled={isSubmitting}>
                <BsSave /> {isSubmitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
