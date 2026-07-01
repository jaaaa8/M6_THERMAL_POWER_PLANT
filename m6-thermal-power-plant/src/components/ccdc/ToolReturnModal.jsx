import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { BsBoxArrowInLeft, BsSave, BsXCircle } from 'react-icons/bs';
import { toolBorrowLogService } from '../../services/toolService';

/**
 * ToolReturnModal — Thủ kho xác nhận nhận lại CCDC.
 *
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Function} props.onSaved
 * @param {object|null} props.log
 */
export default function ToolReturnModal({ show, onClose, onSaved, log }) {
  if (!log) return null;

  const validationSchema = Yup.object({
    damagedQuantity: Yup.number()
      .typeError('Số lượng phải là số')
      .integer('Số lượng phải là số nguyên')
      .min(0, 'Số lượng hư hỏng không được âm')
      .max(log.quantity, `Không thể vượt quá số lượng đã mượn (${log.quantity})`),
    returnNote: Yup.string().max(500, 'Ghi chú quá dài'),
  });

  return (
    <Modal show={show} onHide={onClose} centered>
      <Formik
        initialValues={{ damagedQuantity: 0, returnNote: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            const res = await toolBorrowLogService.returnTool(log.id, {
              damagedQuantity: Number(values.damagedQuantity) || 0,
              returnNote: values.returnNote,
            });
            toast.success('Đã ghi nhận trả CCDC');
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
                <BsBoxArrowInLeft className="me-2" style={{ color: 'var(--color-status-normal)' }} />
                Xác nhận trả CCDC
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {log.toolName} ({log.toolCode}) · {log.accountName} đã mượn <strong>{log.quantity}</strong> {' '}
                {log.overdue && <span style={{ color: 'var(--color-status-danger)' }}>— Đã quá hạn</span>}
              </p>
              <div className="mb-3">
                <label htmlFor="return-damagedQuantity" className="form-label">
                  Số lượng hư hỏng khi trả (nếu có)
                </label>
                <Field
                  id="return-damagedQuantity"
                  name="damagedQuantity"
                  type="number"
                  min={0}
                  max={log.quantity}
                  className={`form-control ${touched.damagedQuantity && errors.damagedQuantity ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="damagedQuantity" component="div" className="invalid-feedback" />
              </div>
              <div className="mb-1">
                <label htmlFor="return-returnNote" className="form-label">Ghi chú tình trạng khi trả</label>
                <Field as="textarea" id="return-returnNote" name="returnNote" rows={2} className="form-control" placeholder="VD: CCDC còn tốt, đầy đủ phụ kiện" />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
                <BsXCircle /> Huỷ bỏ
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                <BsSave /> {isSubmitting ? 'Đang lưu...' : 'Xác nhận đã trả'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
