import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { BsExclamationOctagon, BsSave, BsXCircle } from 'react-icons/bs';
import { toolService } from '../../services/toolService';

/**
 * ToolDamageModal — Huỷ (loại bỏ khỏi sử dụng) số lượng CCDC bị hư hỏng.
 *
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Function} props.onSaved - (tool) => void
 * @param {object|null} props.tool
 */
export default function ToolDamageModal({ show, onClose, onSaved, tool }) {
  if (!tool) return null;

  const available = tool.quantityAvailable ?? (tool.quantity - tool.quantityBorrowed - tool.quantityDamaged);

  const validationSchema = Yup.object({
    quantity: Yup.number()
      .typeError('Số lượng phải là số')
      .integer('Số lượng phải là số nguyên')
      .min(1, 'Số lượng hư hỏng phải lớn hơn 0')
      .max(available, `Không thể vượt quá số lượng khả dụng (${available})`)
      .required('Số lượng không được để trống'),
    note: Yup.string().max(500, 'Ghi chú quá dài'),
  });

  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Formik
        initialValues={{ quantity: 1, note: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            const res = await toolService.markDamaged(tool.id, {
              quantity: Number(values.quantity),
              note: values.note,
            });
            toast.success(`Đã huỷ ${values.quantity} ${tool.unit} hư hỏng`);
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
                <BsExclamationOctagon className="me-2" style={{ color: 'var(--color-status-danger)' }} />
                Huỷ CCDC hư hỏng — {tool.toolCode}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {tool.name} · Khả dụng hiện tại: <strong>{available}</strong> {tool.unit}
              </p>
              <div className="mb-3">
                <label htmlFor="dmg-quantity" className="form-label">
                  Số lượng hư hỏng <span className="required-asterisk">*</span>
                </label>
                <Field
                  id="dmg-quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={available}
                  autoFocus
                  className={`form-control ${touched.quantity && errors.quantity ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="quantity" component="div" className="invalid-feedback" />
              </div>
              <div className="mb-1">
                <label htmlFor="dmg-note" className="form-label">Lý do / tình trạng hư hỏng</label>
                <Field as="textarea" id="dmg-note" name="note" rows={2} className="form-control" placeholder="VD: Gãy mỏ lết, không thể sửa chữa" />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
                <BsXCircle /> Huỷ bỏ
              </Button>
              <Button variant="danger" size="sm" type="submit" disabled={isSubmitting}>
                <BsSave /> {isSubmitting ? 'Đang lưu...' : 'Xác nhận huỷ'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
