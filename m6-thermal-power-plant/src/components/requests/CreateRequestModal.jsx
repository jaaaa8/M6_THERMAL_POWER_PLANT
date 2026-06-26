import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BsPlusCircle, BsPencilSquare } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { repairRequestService, PRIORITY, PRIORITY_LABEL } from '../../services/repairRequestService';
import { equipmentService } from '../../services/equipmentService';
import './CreateRequestModal.css';

/**
 * Yup validation schema cho form tạo yêu cầu sửa chữa
 */
const createRequestSchema = Yup.object({
  thietBiId: Yup.number()
    .required('Vui lòng chọn thiết bị')
    .positive('Vui lòng chọn thiết bị'),
  moTaSuCo: Yup.string()
    .required('Mô tả sự cố không được để trống')
    .min(10, 'Mô tả tối thiểu 10 ký tự')
    .max(1000, 'Mô tả không quá 1000 ký tự'),
  mucDoUuTien: Yup.string()
    .required('Vui lòng chọn mức độ ưu tiên')
    .oneOf(Object.values(PRIORITY), 'Mức độ ưu tiên không hợp lệ'),
});

/**
 * CreateRequestModal — Modal tạo mới hoặc sửa yêu cầu sửa chữa.
 *
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Function} props.onSuccess - Callback sau khi tạo/sửa thành công
 * @param {object|null} props.editRequest - Nếu truyền vào thì mở ở chế độ sửa
 */
export default function CreateRequestModal({ show, onClose, onSuccess, editRequest = null }) {
  const isEditMode = !!editRequest;
  const [equipments, setEquipments] = useState([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  // Bộ lọc UI theo hệ thống (không gửi lên backend — chỉ để thu hẹp danh sách thiết bị)
  const [selectedHeThong, setSelectedHeThong] = useState('');

  const loadEquipments = async () => {
    try {
      setLoadingEquipments(true);
      const res = await equipmentService.getAll();
      setEquipments(res.data);
    } catch (err) {
      toast.error('Không thể tải danh sách thiết bị');
    } finally {
      setLoadingEquipments(false);
    }
  };

  useEffect(() => {
    if (show) {
      loadEquipments();
      setSelectedHeThong('');
    }
  }, [show]);

  const heThongOptions = [...new Set(equipments.map((eq) => eq.heThong))];

  const filteredEquipments = selectedHeThong
    ? equipments.filter((eq) => eq.heThong === selectedHeThong)
    : equipments;

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEditMode) {
        await repairRequestService.update(editRequest.id, {
          moTaSuCo: values.moTaSuCo,
          mucDoUuTien: values.mucDoUuTien,
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
    { value: PRIORITY.THAP, label: PRIORITY_LABEL.THAP, colorClass: 'priority-low' },
    { value: PRIORITY.TRUNG_BINH, label: PRIORITY_LABEL.TRUNG_BINH, colorClass: 'priority-medium' },
    { value: PRIORITY.CAO, label: PRIORITY_LABEL.CAO, colorClass: 'priority-high' },
    { value: PRIORITY.KHAN_CAP, label: PRIORITY_LABEL.KHAN_CAP, colorClass: 'priority-critical' },
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
          thietBiId: editRequest?.thietBiId || '',
          moTaSuCo: editRequest?.moTaSuCo || '',
          mucDoUuTien: editRequest?.mucDoUuTien || '',
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
              {/* Lọc theo hệ thống (tùy chọn) */}
              <Form.Group className="mb-4">
                <Form.Label className="crm-label">Hệ thống</Form.Label>
                <Form.Select
                  value={selectedHeThong}
                  disabled={loadingEquipments || isEditMode}
                  onChange={(e) => {
                    setSelectedHeThong(e.target.value);
                    // Đổi hệ thống → reset thiết bị đã chọn (tránh thiết bị không thuộc hệ thống mới)
                    setFieldValue('thietBiId', '');
                  }}
                >
                  <option value="">— Tất cả hệ thống —</option>
                  {heThongOptions.map((ht) => (
                    <option key={ht} value={ht}>{ht}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Chọn thiết bị */}
              <Form.Group className="mb-4">
                <Form.Label className="crm-label">
                  Thiết bị <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="thietBiId"
                  value={values.thietBiId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.thietBiId && !!errors.thietBiId}
                  disabled={loadingEquipments || isEditMode}
                >
                  <option value="">
                    {loadingEquipments ? 'Đang tải thiết bị...' : '— Chọn thiết bị —'}
                  </option>
                  {filteredEquipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.maKKS}] {eq.tenThietBi} — {eq.heThong}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.thietBiId}
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
                  name="moTaSuCo"
                  placeholder="Mô tả chi tiết hiện tượng sự cố, vị trí, mức độ ảnh hưởng..."
                  value={values.moTaSuCo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.moTaSuCo && !!errors.moTaSuCo}
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
                <div className="d-flex justify-content-between mt-1">
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {errors.moTaSuCo}
                  </Form.Control.Feedback>
                  <small className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                    {values.moTaSuCo.length}/1000
                  </small>
                </div>
              </Form.Group>

              {/* Mức độ ưu tiên — Radio Pills */}
              <Form.Group className="mb-3">
                <Form.Label className="crm-label">
                  Mức độ ưu tiên <span className="text-danger">*</span>
                </Form.Label>
                <div className="crm-priority-group">
                  {priorityOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`crm-priority-pill ${opt.colorClass} ${
                        values.mucDoUuTien === opt.value ? 'active' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="mucDoUuTien"
                        value={opt.value}
                        checked={values.mucDoUuTien === opt.value}
                        onChange={() => setFieldValue('mucDoUuTien', opt.value)}
                      />
                      <span className="crm-priority-dot" />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {touched.mucDoUuTien && errors.mucDoUuTien && (
                  <div className="text-danger" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                    {errors.mucDoUuTien}
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
