import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { BsBoxArrowInDown, BsSave, BsXCircle } from 'react-icons/bs';
import { toolService } from '../../services/toolService';

const validationSchema = Yup.object({
  quantity: Yup.number()
    .typeError('Số lượng phải là số')
    .integer('Số lượng phải là số nguyên')
    .min(1, 'Số lượng nhập thêm phải lớn hơn 0')
    .required('Số lượng không được để trống'),
  note: Yup.string().max(500, 'Ghi chú quá dài'),
});

/**
 * ToolQuantityModal — Nhập thêm số lượng CCDC vào kho.
 *
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Function} props.onSaved - (tool) => void
 * @param {object|null} props.tool
 */
export default function ToolQuantityModal({ show, onClose, onSaved, tool }) {
  if (!tool) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="md">
      <Formik
        initialValues={{ quantity: 1, note: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            const res = await toolService.addQuantity(tool.id, {
              quantity: Number(values.quantity),
              note: values.note,
            });
            toast.success(`Đã nhập thêm ${values.quantity} ${tool.unit} ${tool.name}`);
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
                <BsBoxArrowInDown className="me-2" style={{ color: 'var(--color-status-normal)' }} />
                Nhập kho — {tool.toolCode}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {tool.name} · Hiện có <strong>{tool.quantity}</strong> {tool.unit} trong kho
              </p>
              <div className="mb-3">
                <label htmlFor="qty-quantity" className="form-label">
                  Số lượng nhập thêm <span className="required-asterisk">*</span>
                </label>
                <Field
                  id="qty-quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  autoFocus
                  className={`form-control ${touched.quantity && errors.quantity ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="quantity" component="div" className="invalid-feedback" />
              </div>
              <div className="mb-1">
                <label htmlFor="qty-note" className="form-label">Ghi chú</label>
                <Field as="textarea" id="qty-note" name="note" rows={3} className="form-control" placeholder="VD: Nhập theo hoá đơn số..." />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
                <BsXCircle /> Huỷ bỏ
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                <BsSave /> {isSubmitting ? 'Đang lưu...' : 'Nhập kho'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
