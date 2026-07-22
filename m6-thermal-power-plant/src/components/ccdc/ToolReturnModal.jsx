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

  // Số còn đang mượn (chưa giải quyết) = số mượn gốc - (đã trả tốt + đã báo hư)
  const remaining = log.quantity - (log.returnedQuantity || 0);

  const validationSchema = Yup.object({
    returnQuantity: Yup.number()
      .typeError('Số lượng phải là số')
      .integer('Số lượng phải là số nguyên')
      .min(0, 'Không được âm'),
    damagedQuantity: Yup.number()
      .typeError('Số lượng phải là số')
      .integer('Số lượng phải là số nguyên')
      .min(0, 'Không được âm')
      // Tổng "trả tốt + hư" phải >= 1 và <= số còn đang mượn
      .test('total-range', '', function (val) {
        const total = (Number(this.parent.returnQuantity) || 0) + (Number(val) || 0);
        if (total < 1) {
          return this.createError({ message: 'Phải nhập số trả tốt hoặc số hư (ít nhất 1)' });
        }
        if (total > remaining) {
          return this.createError({ message: `Tổng trả tốt + hư không được vượt quá số còn đang mượn (${remaining})` });
        }
        return true;
      }),
    returnNote: Yup.string().max(500, 'Ghi chú quá dài'),
  });

  return (
    <Modal show={show} onHide={onClose} centered>
      <Formik
        initialValues={{ returnQuantity: remaining, damagedQuantity: 0, returnNote: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            const res = await toolBorrowLogService.returnTool(log.id, {
              returnQuantity: Number(values.returnQuantity),
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
        {({ touched, errors, isSubmitting, values }) => (
          <Form noValidate>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
                <BsBoxArrowInLeft className="me-2" style={{ color: 'var(--color-status-normal)' }} />
                Xác nhận trả CCDC
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {log.toolName} ({log.toolCode}) · {log.accountName} đã mượn <strong>{log.quantity}</strong>
                {(log.returnedQuantity || 0) > 0 && (
                  <> · đã giải quyết <strong>{log.returnedQuantity}</strong> · còn lại <strong>{remaining}</strong></>
                )}{' '}
                {log.overdue && <span style={{ color: 'var(--color-status-danger)' }}>— Đã quá hạn</span>}
              </p>
              <div className="row g-3 mb-2">
                <div className="col-6">
                  <label htmlFor="return-returnQuantity" className="form-label fw-semibold">
                    Số trả 
                  </label>
                  <Field
                    id="return-returnQuantity"
                    name="returnQuantity"
                    type="number"
                    min={0}
                    max={remaining}
                    className={`form-control ${touched.returnQuantity && errors.returnQuantity ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="returnQuantity" component="div" className="invalid-feedback" />
                </div>
                <div className="col-6">
                  <label htmlFor="return-damagedQuantity" className="form-label fw-semibold">
                    Số báo hư
                  </label>
                  <Field
                    id="return-damagedQuantity"
                    name="damagedQuantity"
                    type="number"
                    min={0}
                    max={remaining}
                    className={`form-control ${touched.damagedQuantity && errors.damagedQuantity ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="damagedQuantity" component="div" className="invalid-feedback" />
                </div>
              </div>
              {(() => {
                const total = (Number(values.returnQuantity) || 0) + (Number(values.damagedQuantity) || 0);
                const left = remaining - total;
                if (total <= 0 || total > remaining) return null;
                return left > 0 ? (
                  <div className="form-text text-warning mb-3">
                    Giải quyết {total}/{remaining} — còn <strong>{left}</strong> chưa trả → phiếu vẫn "đang mượn"
                  </div>
                ) : (
                  <div className="form-text text-success mb-3">
                    Giải quyết đủ {remaining}/{remaining} → phiếu sẽ chuyển "đã trả"
                  </div>
                );
              })()}
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
