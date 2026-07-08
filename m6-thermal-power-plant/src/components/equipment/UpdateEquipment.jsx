import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsCpu, BsCloudUpload, BsX } from 'react-icons/bs';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import * as equipmentService from "../../services/equipment/equipmentService";
import * as systemService from '../../services/equipment/systemService';
import PageHeader from '../common/PageHeader';
import './style/AddEquipment.css';

export default function UpdateEquipment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [equipmentData, setEquipmentData] = useState(null);
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSystems, setLoadingSystems] = useState(true);

  // Fetch systems for dropdown
  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const res = await systemService.getAll('', '', 0, 1000);
        setSystems(res.data?.content || []);
      } catch (e) {
        console.error('Lỗi tải hệ thống:', e);
      } finally {
        setLoadingSystems(false);
      }
    };
    fetchSystems();
  }, []);

  // Fetch current equipment details
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await equipmentService.getById(id);
        setEquipmentData(res.data);
      } catch (e) {
        console.error(e);
        toast.error('Không tìm thấy thiết bị cần chỉnh sửa');
        navigate('/equipment/equipments');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchEquipment();
    }
  }, [id, navigate]);

  // Validation Schema
  const equipmentSchema = Yup.object().shape({
    kksCode: Yup.string()
      .required('Mã KKS là bắt buộc')
      .matches(/^[A-Z0-9_-]+$/, 'Mã KKS chỉ gồm chữ hoa, số và dấu gạch ngang/gạch dưới')
      .min(3, 'Mã KKS tối thiểu 3 ký tự'),

    equipmentName: Yup.string()
      .required('Tên thiết bị là bắt buộc')
      .min(3, 'Tên thiết bị tối thiểu 3 ký tự'),

    systemId: Yup.string()
      .required('Vui lòng chọn hệ thống'),

    equipmentType: Yup.string()
      .required('Vui lòng chọn loại thiết bị'),

    status: Yup.string()
      .required('Vui lòng chọn trạng thái'),

    model: Yup.string()
      .max(100, 'Model tối đa 100 ký tự'),

    manufacturer: Yup.string()
      .max(100, 'Nhà sản xuất tối đa 100 ký tự'),

    installYear: Yup.number()
      .typeError('Năm lắp đặt phải là số')
      .integer('Năm lắp đặt phải là số nguyên')
      .min(1900, 'Năm lắp đặt từ 1900 trở đi')
      .max(new Date().getFullYear(), 'Năm lắp đặt không thể ở tương lai'),

    description: Yup.string()
      .max(500, 'Mô tả tối đa 500 ký tự'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const selectedSystem = systems.find(s => s.id === Number(values.systemId));
      const payload = {
        ...equipmentData, // Keep existing parameters and properties
        ...values,
        systemId: Number(values.systemId),
        systemName: selectedSystem ? selectedSystem.name : equipmentData.systemName
      };

      await equipmentService.update(id, payload);
      toast.success('Cập nhật thiết bị thành công!');
      navigate('/equipment/equipments');
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Cập nhật thiết bị thất bại'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" className="mb-2" />
        <div className="text-secondary">Đang tải thông tin thiết bị...</div>
      </div>
    );
  }

  // Pre-fill initial values
  const initialValues = {
    kksCode: equipmentData?.kksCode || '',
    equipmentName: equipmentData?.equipmentName || '',
    systemId: equipmentData?.systemId || '',
    equipmentType: equipmentData?.equipmentType || 'Bơm',
    status: equipmentData?.status || 'ACTIVE',
    model: equipmentData?.model || '',
    manufacturer: equipmentData?.manufacturer || '',
    installYear: equipmentData?.installYear || new Date().getFullYear(),
    description: equipmentData?.description || '',
    imageUrl: equipmentData?.imageUrl || ''
  };

  return (
    <div className="add-equipment-container animate-fade-in">
      <PageHeader
        title="Chỉnh sửa thiết bị"
        subtitle="Cập nhật thông tin chi tiết thiết bị kỹ thuật"
        icon={<BsCpu />}
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Hệ thống & Thiết bị', path: '/equipment/system' },
          { label: 'Thiết bị', path: '/equipment/equipments' },
          { label: 'Chỉnh sửa thiết bị' }
        ]}
      />

      <div className="equipment-form-card">
        <Formik
          initialValues={initialValues}
          validationSchema={equipmentSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting,
            setFieldValue
          }) => {
            const handleImageChange = (e) => {
              const file = e.target.files[0];
              if (file) {
                if (file.size > 2 * 1024 * 1024) {
                  toast.error('Kích thước ảnh không vượt quá 2MB');
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                  setFieldValue('imageUrl', reader.result);
                };
                reader.readAsDataURL(file);
              }
            };

            const triggerFileSelect = () => {
              fileInputRef.current.click();
            };

            const removeImage = (e) => {
              e.stopPropagation();
              setFieldValue('imageUrl', '');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            };

            return (
              <FormikForm onSubmit={handleSubmit}>
                {/* Upload Image Section */}
                <div className="image-upload-row">
                  <div
                    className="image-upload-dropzone"
                    onClick={triggerFileSelect}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="d-none"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <BsCloudUpload className="image-upload-icon" />
                    <span className="fw-semibold">Kéo thả ảnh hoặc</span>
                    <span className="text-primary fw-bold" style={{ textDecoration: 'underline' }}>Chọn ảnh</span>
                    <span className="text-muted small mt-1">PNG, JPG, JPEG (tối đa 2MB)</span>
                  </div>

                  <div className="image-preview-container">
                    {values.imageUrl ? (
                      <>
                        <img
                          className="image-preview-img"
                          src={values.imageUrl}
                          alt="Preview"
                        />
                        <button
                          type="button"
                          className="image-preview-remove"
                          onClick={removeImage}
                          title="Xóa ảnh"
                        >
                          <BsX />
                        </button>
                      </>
                    ) : (
                      <div className="image-preview-placeholder">
                        <BsCpu />
                        <span>Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                </div>

                <Row className="g-4">
                  {/* Mã KKS */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="kksCode" className="required">
                        Mã KKS
                      </Form.Label>
                      <Form.Control
                        id="kksCode"
                        name="kksCode"
                        type="text"
                        placeholder="VD: 10LAA01AP001..."
                        value={values.kksCode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.kksCode && !!errors.kksCode}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.kksCode}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Tên thiết bị */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="equipmentName" className="required">
                        Tên thiết bị
                      </Form.Label>
                      <Form.Control
                        id="equipmentName"
                        name="equipmentName"
                        type="text"
                        placeholder="VD: Bơm nước cấp A..."
                        value={values.equipmentName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.equipmentName && !!errors.equipmentName}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.equipmentName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Hệ thống */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="systemId" className="required">
                        Hệ thống
                      </Form.Label>
                      <Form.Select
                        id="systemId"
                        name="systemId"
                        value={values.systemId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.systemId && !!errors.systemId}
                        disabled={loadingSystems}
                      >
                        <option value="">Chọn hệ thống...</option>
                        {systems.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.systemId}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Loại thiết bị */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="equipmentType" className="required">
                        Loại thiết bị
                      </Form.Label>
                      <Form.Select
                        id="equipmentType"
                        name="equipmentType"
                        value={values.equipmentType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.equipmentType && !!errors.equipmentType}
                      >
                        <option value="Bơm">Bơm</option>
                        <option value="Van">Van</option>
                        <option value="Động cơ">Động cơ</option>
                        <option value="Đo lường">Đo lường</option>
                        <option value="Khác">Khác</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.equipmentType}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Trạng thái */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="status" className="required">
                        Trạng thái
                      </Form.Label>
                      <Form.Select
                        id="status"
                        name="status"
                        value={values.status}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.status && !!errors.status}
                      >
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="MAINTENANCE">Bảo dưỡng</option>
                        <option value="FAILURE">Sự cố</option>
                        <option value="STANDBY">Dự phòng</option>
                        <option value="RETIRED">Thanh lý</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.status}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Model */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="model">
                        Model
                      </Form.Label>
                      <Form.Control
                        id="model"
                        name="model"
                        type="text"
                        placeholder="VD: CR 64-4..."
                        value={values.model}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.model && !!errors.model}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.model}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Nhà sản xuất */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="manufacturer">
                        Nhà sản xuất
                      </Form.Label>
                      <Form.Control
                        id="manufacturer"
                        name="manufacturer"
                        type="text"
                        placeholder="VD: Grundfos..."
                        value={values.manufacturer}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.manufacturer && !!errors.manufacturer}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.manufacturer}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Năm lắp đặt */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="installYear">
                        Năm lắp đặt
                      </Form.Label>
                      <Form.Control
                        id="installYear"
                        name="installYear"
                        type="number"
                        placeholder="VD: 2020..."
                        value={values.installYear}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.installYear && !!errors.installYear}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.installYear}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Mô tả */}
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label htmlFor="description">
                        Mô tả thiết bị
                      </Form.Label>
                      <Form.Control
                        id="description"
                        name="description"
                        as="textarea"
                        rows={4}
                        placeholder="Nhập mô tả chi tiết chức năng và vị trí lắp đặt..."
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.description && !!errors.description}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.description}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Metadata Footer */}
                {equipmentData && (
                  <div className="metadata-footer">
                    <div className="metadata-footer-row">
                      <span>Cập nhật cuối:</span>
                      <span className="fw-semibold">{equipmentData.lastUpdated || 'Chưa rõ'}</span>
                    </div>
                    <div className="metadata-footer-row">
                      <span>Người cập nhật:</span>
                      <span className="fw-semibold">{equipmentData.updatedBy || 'Chưa rõ'}</span>
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="d-flex justify-content-end gap-3 mt-4 border-top pt-4">
                  <Button
                    variant="light"
                    onClick={() => navigate('/equipment/equipments')}
                    disabled={isSubmitting}
                    className="px-4 d-inline-flex align-items-center gap-2"
                  >
                    <BsArrowLeft />
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 d-inline-flex align-items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" animation="border" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu lại'
                    )}
                  </Button>
                </div>
              </FormikForm>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}
