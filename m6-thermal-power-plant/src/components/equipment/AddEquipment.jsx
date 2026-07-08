import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsCpu, BsCloudUpload, BsX } from 'react-icons/bs';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import * as systemService from '../../services/equipment/systemService';
import PageHeader from '../common/PageHeader';
import './style/AddEquipment.css';

export default function AddEquipment() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [systems, setSystems] = useState([]);
  const [loadingSystems, setLoadingSystems] = useState(true);

  // Fetch systems for dropdown
  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const res = await systemService.getAll({
          name: '',
          status: '',
          page: 0,
          size: 1000,
        });
        setSystems(res.data?.content || []);
      } catch (e) {
        console.error('Lỗi tải hệ thống:', e);
        toast.error('Không thể tải danh sách hệ thống');
      } finally {
        setLoadingSystems(false);
      }
    };
    fetchSystems();
  }, []);

  // Form validation schema with Yup
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

  const initialValues = {
    kksCode: '',
    equipmentName: '',
    systemId: '',
    equipmentType: 'Bơm',
    status: 'ACTIVE',
    model: '',
    manufacturer: '',
    installYear: new Date().getFullYear(),
    description: '',
    imageUrl: ''
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Find systemName from systemId
      const selectedSystem = systems.find(s => s.id === Number(values.systemId));
      const payload = {
        ...values,
        systemId: Number(values.systemId),
        systemName: selectedSystem ? selectedSystem.name : '',
        technicalParameters: [] // Initialize empty technical parameters
      };

      await equipmentService.create(payload);
      toast.success('Thêm mới thiết bị thành công!');
      navigate('/equipment/equipments');
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Thêm mới thiết bị thất bại'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-equipment-container animate-fade-in">
      <PageHeader
        title="Thêm thiết bị"
        subtitle="Khởi tạo thông tin thiết bị kỹ thuật mới trong hệ thống"
        icon={<BsCpu />}
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Hệ thống & Thiết bị', path: '/equipment/system' },
          { label: 'Thiết bị', path: '/equipment/equipments' },
          { label: 'Thêm thiết bị' }
        ]}
      />

      <div className="equipment-form-card">
        <Formik
          initialValues={initialValues}
          validationSchema={equipmentSchema}
          onSubmit={handleSubmit}
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
            // Read image files and convert to base64
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
