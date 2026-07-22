import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BsPlusCircle, BsPencilSquare } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { repairRequestService, PRIORITY, PRIORITY_LABEL } from '../../services/repairRequestService';
import * as equipmentService from '../../services/equipment/equipmentService';
import * as systemService from '../../services/equipment/systemService';
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

/**
 * CreateRequestModal — Modal tạo mới yêu cầu sửa chữa.
 */
export default function CreateRequestModal({ show, onClose, onSuccess, editRequest = null }) {
  const isEditMode = !!editRequest;
  const [systems, setSystems] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState('');

  // Load danh sách hệ thống
  const loadSystems = async () => {
    try {
      const res = await systemService.getAllSystems('', '', 0, 100);
      setSystems(res.data?.content || res.data || []);
    } catch (err) {
      console.error('Không thể tải danh sách hệ thống', err);
    }
  };

  // Load thiết bị — nếu chọn hệ thống thì dùng API lọc theo system, nếu không thì lấy tất cả
  const loadEquipments = async (systemId) => {
    try {
      setLoadingEquipments(true);
      let res;
      if (systemId) {
        res = await equipmentService.getBySystem(systemId);
      } else {
        res = await equipmentService.getAll();
      }
      setEquipments(res.data?.content || res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách thiết bị');
    } finally {
      setLoadingEquipments(false);
    }
  };

  useEffect(() => {
    if (show) {
      loadSystems();
      loadEquipments('');
      setSelectedSystemId('');
    }
  }, [show]);

  const handleSystemChange = (systemId, setFieldValue) => {
    setSelectedSystemId(systemId);
    setFieldValue('equipmentId', '');
    loadEquipments(systemId);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEditMode) {
        await repairRequestService.update(editRequest.id, {
          issueDescription: values.issueDescription,
          priority: values.priority,
        });
        toast.success('Cập nhật yêu cầu thành công!');
      } else {
        await repairRequestService.create(values);
        toast.success('Tạo yêu cầu sửa chữa thành công!');
        resetForm();
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
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
          {isEditMode ? (
            <><BsPencilSquare className="me-2" style={{ color: 'var(--color-accent)' }} />Sửa yêu cầu sửa chữa</>
          ) : (
            <><BsPlusCircle className="me-2" style={{ color: 'var(--color-primary-600)' }} />Tạo yêu cầu sửa chữa mới</>
          )}
        </Modal.Title>
      </Modal.Header>

      <Formik
        enableReinitialize
        initialValues={{
          equipmentId: editRequest?.equipmentId || '',
          issueDescription: editRequest?.issueDescription || '',
          priority: editRequest?.priority || '',
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
                <Form.Select
                  value={selectedSystemId}
                  disabled={loadingEquipments || isEditMode}
                  onChange={(e) => handleSystemChange(e.target.value, setFieldValue)}
                >
                  <option value="">— Tất cả hệ thống —</option>
                  {systems.map((sys) => (
                    <option key={sys.id} value={sys.id}>
                      [{sys.code}] {sys.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Chọn thiết bị */}
              <Form.Group className="mb-4">
                <Form.Label className="crm-label">
                  Thiết bị <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="equipmentId"
                  value={values.equipmentId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.equipmentId && !!errors.equipmentId}
                  disabled={loadingEquipments || isEditMode}
                >
                  <option value="">
                    {loadingEquipments ? 'Đang tải thiết bị...' : '— Chọn thiết bị —'}
                  </option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.kksCode}] {eq.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.equipmentId}
                </Form.Control.Feedback>
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
                {isSubmitting
                  ? (isEditMode ? 'Đang lưu...' : 'Đang tạo...')
                  : (isEditMode ? 'Lưu thay đổi' : 'Tạo yêu cầu')
                }
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
