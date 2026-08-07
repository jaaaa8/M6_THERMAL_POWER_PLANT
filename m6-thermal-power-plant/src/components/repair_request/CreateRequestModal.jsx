import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BsPlusCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { repairRequestService, PRIORITY, PRIORITY_LABEL } from '../../services/repairRequestService';
import { getApiErrorMessage } from '../../services/apiError';
import * as equipmentService from '../../services/equipment/equipmentService';
import * as systemService from '../../services/equipment/systemService';
import SearchSelectField from '../common/SearchSelectField';
import './CreateRequestModal.css';

/**
 * Yup validation schema cho form tạo yêu cầu sửa chữa
 */
const createRequestSchema = Yup.object({
  equipmentId: Yup.number()
    .required('Vui lòng chọn thiết bị')
    .positive('Vui lòng chọn thiết bị'),
  issueDescription: Yup.string()
    .required('Mô tả sự cố không được để trống')
    .min(10, 'Mô tả tối thiểu 10 ký tự')
    .max(1000, 'Mô tả không quá 1000 ký tự'),
  priority: Yup.string()
    .required('Vui lòng chọn mức độ ưu tiên')
    .oneOf(Object.values(PRIORITY), 'Mức độ ưu tiên không hợp lệ'),
});

/* ============================================================
   Helpers render kết quả search Hệ thống / Thiết bị.
   ============================================================ */
const SYS_KEY = (s) => s.id;
const SYS_LABEL = (s) => `[${s.code}] ${s.name}`;
const SYS_RENDER = (s) => (
  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
    <span className="font-mono me-1">{s.code}</span>{s.name}
  </div>
);
const EQ_KEY = (e) => e.id;
const EQ_LABEL = (e) => `[${e.kksCode}] ${e.name}`;
const EQ_RENDER = (e) => (
  <div>
    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
      <span className="font-mono me-1">{e.kksCode}</span>{e.name}
    </div>
    {e.equipmentType && <div className="text-muted small">{e.equipmentType}</div>}
  </div>
);

/**
 * CreateRequestModal — Modal tạo mới yêu cầu sửa chữa.
 */
export default function CreateRequestModal({ show, onClose, onSuccess }) {
  // Hệ thống đã chọn — {id, label} hiển thị trong ô "Hệ thống".
  const [selectedSystem, setSelectedSystem] = useState(null);
  // Nhãn thiết bị đã chọn (hiển thị trong ô "Thiết bị" sau khi chọn).
  const [eqLabel, setEqLabel] = useState('');

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await repairRequestService.create(values);
      toast.success('Tạo yêu cầu sửa chữa thành công!');
      resetForm();
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: PRIORITY.LOW, label: PRIORITY_LABEL.LOW, colorClass: 'priority-low' },
    { value: PRIORITY.NORMAL, label: PRIORITY_LABEL.NORMAL, colorClass: 'priority-medium' },
    { value: PRIORITY.HIGH, label: PRIORITY_LABEL.HIGH, colorClass: 'priority-high' },
    { value: PRIORITY.EMERGENCY, label: PRIORITY_LABEL.EMERGENCY, colorClass: 'priority-critical' },
  ];

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="create-request-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsPlusCircle className="me-2" style={{ color: 'var(--color-primary)' }} />Tạo yêu cầu sửa chữa mới
        </Modal.Title>
      </Modal.Header>

      <Formik
        enableReinitialize
        initialValues={{
          equipmentId: '',
          issueDescription: '',
          priority: '',
        }}
        validationSchema={createRequestSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit: formikSubmit,
          isSubmitting,
          setFieldValue,
        }) => (
          <Form onSubmit={formikSubmit} noValidate>
            <Modal.Body>
              {/* Lọc theo hệ thống */}
              <Form.Group className="mb-4">
                <Form.Label className="crm-label">Hệ thống</Form.Label>
                <SearchSelectField
                  mode="single"
                  searchFn={(p) => systemService.getAllSystems(p.query, '', p.page, p.size)}
                  getKey={SYS_KEY}
                  renderItem={SYS_RENDER}
                  placeholder="Tìm theo tên hệ thống..."
                  value={selectedSystem ? selectedSystem.id : null}
                  onChange={(item) => {
                    setSelectedSystem(item ? { id: item.id, label: SYS_LABEL(item) } : null);
                    setFieldValue('equipmentId', '');
                    setEqLabel('');
                  }}
                  selectedLabel={selectedSystem?.label}
                />
              </Form.Group>

              {/* Chọn thiết bị */}
              <Form.Group className="mb-4">
                <Form.Label className="crm-label">
                  Thiết bị <span className="text-danger">*</span>
                </Form.Label>
                <SearchSelectField
                  mode="single"
                  searchFn={(p) => equipmentService.getAll({
                    systemId: selectedSystem?.id,
                    kw: p.query || undefined,
                    page: p.page,
                    size: p.size,
                  })}
                  getKey={EQ_KEY}
                  renderItem={EQ_RENDER}
                  placeholder="Tìm theo mã KKS, tên thiết bị..."
                  value={values.equipmentId || null}
                  onChange={(item) => {
                    setFieldValue('equipmentId', item ? item.id : '');
                    setEqLabel(item ? EQ_LABEL(item) : '');
                  }}
                  selectedLabel={eqLabel}
                  error={touched.equipmentId && errors.equipmentId}
                />
              </Form.Group>

              {/* Mô tả sự cố */}
              <Form.Group className="mb-4">
                <Form.Label className="crm-label">
                  Mô tả sự cố <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="issueDescription"
                  placeholder="Mô tả chi tiết hiện tượng sự cố, vị trí, mức độ ảnh hưởng..."
                  value={values.issueDescription}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.issueDescription && !!errors.issueDescription}
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
                <div className="d-flex justify-content-between mt-1">
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {errors.issueDescription}
                  </Form.Control.Feedback>
                  <small className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                    {values.issueDescription.length}/1000
                  </small>
                </div>
              </Form.Group>

              {/* Mức độ ưu tiên — Radio Buttons có nhãn chữ rõ ràng */}
              <Form.Group className="mb-3">
                <Form.Label className="crm-label">
                  Mức độ ưu tiên <span className="text-danger">*</span>
                </Form.Label>
                <div className="crm-priority-group">
                  {priorityOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`crm-priority-pill ${opt.colorClass} ${
                        values.priority === opt.value ? 'active' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={opt.value}
                        checked={values.priority === opt.value}
                        onChange={() => setFieldValue('priority', opt.value)}
                      />
                      <span className="crm-priority-dot" />
                      <span className="crm-priority-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {touched.priority && errors.priority && (
                  <div className="text-danger" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                    {errors.priority}
                  </div>
                )}
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="outline-secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                Huỷ
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
