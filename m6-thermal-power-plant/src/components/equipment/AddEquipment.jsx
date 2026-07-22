import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsCpu, BsCloudUpload, BsX } from 'react-icons/bs';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import * as systemService
  from "../../services/equipment/systemService";
import * as equipmentService from "../../services/equipment/equipmentService";
import PageHeader from '../common/PageHeader';
import './style/AddEquipment.css';

export default function AddEquipment() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // system
  const { systemId } = useParams();

  useEffect(() => {

    const loadTypes = async () => {

      const res = await equipmentService.getEquipmentTypes();

      setEquipmentTypes(res.data);

    }

    loadTypes();

  }, []);
  // Form validation schema with Yup
  const equipmentSchema = Yup.object().shape({

    name: Yup.string()
      .required('Tên thiết bị là bắt buộc')
      .min(3, 'Tên thiết bị tối thiểu 3 ký tự'),

    equipmentTypeId: Yup.string()
      .required('Vui lòng chọn loại thiết bị'),

    status: Yup.string()
      .required('Vui lòng chọn trạng thái'),

    model: Yup.string()
      .max(100, 'Model tối đa 100 ký tự'),

    manufacturer: Yup.string()
      .max(100, 'Nhà sản xuất tối đa 100 ký tự'),

    installationYear: Yup.number()
      .typeError('Năm lắp đặt phải là số')
      .integer('Năm lắp đặt phải là số nguyên')
      .min(1900, 'Năm lắp đặt từ 1900 trở đi')
      .max(new Date().getFullYear(), 'Năm lắp đặt không thể ở tương lai'),

    description: Yup.string()
      .max(500, 'Mô tả tối đa 500 ký tự'),
  });

  const initialValues = {

    name: '',
    equipmentTypeId: "",
    status: 'ACTIVE',
    model: '',
    manufacturer: '',
    installationYear: new Date().getFullYear(),
    description: '',
    images: []
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {

      const dto = {
        name: values.name,
        equipmentTypeId: Number(values.equipmentTypeId),
        status: values.status,
        installationYear: values.installationYear,
        manufacturer: values.manufacturer,
        model: values.model,
        description: values.description
      };

      const formData = new FormData();

      formData.append(
        "equipment",
        new Blob(
          [JSON.stringify(dto)],
          {
            type: "application/json"
          }
        )
      );

      values.images.forEach(file => {
        formData.append("images", file);
      });

      const res = await equipmentService.addEquipment(
        systemId,
        formData
      );

      toast.success("Thêm thiết bị thành công");

      navigate(`/equipment/equipments/${res.data.id}`);

    } catch (err) {

      console.log(err);

      toast.error(
        err.response?.data?.message ??
        "Thêm thiết bị thất bại"
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

              const files = Array.from(e.target.files);

              if (!files.length) return;

              setFieldValue(
                "images",
                [
                  ...values.images,
                  ...files
                ]
              );

            };

            const triggerFileSelect = () => {
              fileInputRef.current.click();
            };

            const removeImage = (e) => {
              e.stopPropagation();

              setFieldValue("images", []);

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            };
            return (
              <FormikForm>
                {/* Upload Image Section */}
                <div
                  className="image-upload-dropzone"
                  onClick={triggerFileSelect}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <BsCloudUpload className="image-upload-icon" />
                  <span className="fw-semibold">Kéo thả ảnh hoặc</span>
                  <span className="text-primary fw-bold" style={{ textDecoration: 'underline' }}>Chọn ảnh</span>
                  <span className="text-muted small mt-1">PNG, JPG, JPEG (tối đa 2MB)</span>
                </div>

                <div className="image-preview-container">

                  {values.images.length === 0 && (
                    <div className="image-preview-placeholder">
                      <BsCpu />
                      <span>Chưa có ảnh</span>
                    </div>
                  )}

                  {values.images.map((image, index) => (
                    <div
                      key={index}
                      className="preview-item"
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        className="image-preview-img"
                        alt=""
                      />

                      <button
                        type="button"
                        className="image-preview-remove"
                        onClick={() => {
                          const list = [...values.images];
                          list.splice(index, 1);
                          setFieldValue("images", list);
                        }}
                      >
                        <BsX />
                      </button>
                    </div>
                  ))}

                </div>

                <Row className="g-4">

                  {/* Tên thiết bị */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="name" className="required">
                        Tên thiết bị
                      </Form.Label>
                      <Form.Control
                        id="name"
                        name="name"
                        type="text"
                        placeholder="VD: Bơm nước cấp A..."
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.name && !!errors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Loại thiết bị */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label htmlFor="equipmentTypeId" className="required">
                        Loại thiết bị
                      </Form.Label>
                      <Form.Select
                        id="equipmentTypeId"
                        name="equipmentTypeId"
                        value={values.equipmentTypeId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.equipmentTypeId && !!errors.equipmentTypeId}
                      >
                        <option value=""> Chọn loại thiết bị </option>
                        {
                          equipmentTypes.map(type => (
                            <option
                              key={type.id}
                              value={type.id}
                            >
                              {type.name}
                            </option>
                          ))
                        }
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.equipmentTypeId}
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
                      <Form.Label htmlFor="installationYear">
                        Năm lắp đặt
                      </Form.Label>
                      <Form.Control
                        id="installationYear"
                        name="installationYear"
                        type="number"
                        placeholder="VD: 2020..."
                        value={values.installationYear}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.installationYear && !!errors.installationYear}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.installationYear}
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
                    onClick={() => navigate(`/equipment/equipments?systemId=${systemId}`)}
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
