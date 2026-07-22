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
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await equipmentService.getEquipmentTypes();
        setEquipmentTypes(res.data);
      } catch (e) {
        console.log(e);
        toast.error("Không tải được loại thiết bị");
      }
    };

    fetchTypes();
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
        navigate('/equipment/equipments/system/' + res.data.systemId);
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
    name: Yup.string()
      .required("Tên thiết bị là bắt buộc")
      .min(10, "Tên thiết bị phải từ 10 ký tự")
      .max(255),
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

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append(
        "equipment",
        new Blob(
          [
            JSON.stringify({
              name: values.name,
              equipmentTypeId: Number(values.equipmentTypeId),
              status: values.status,
              manufacturer: values.manufacturer,
              model: values.model,
              installationYear:
                values.installationYear
                  ? Number(values.installationYear)
                  : null,
              description: values.description,
              imageUrls: values.imageUrls

            })
          ],
          {
            type: "application/json"
          }
        )
      );
      values.newImages.forEach(file => {
        formData.append("images", file);
      });

      await equipmentService.update(id, formData);
      toast.success('Cập nhật thiết bị thành công!');
      navigate('/equipment/equipments/system/' + equipmentData.systemId);
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
    name: equipmentData?.name || "",
    equipmentTypeId:
      equipmentData?.equipmentTypeId || "",
    status:
      equipmentData?.status || "ACTIVE",
    manufacturer:
      equipmentData?.manufacturer || "",
    model:
      equipmentData?.model || "",
    installationYear:
      equipmentData?.installationYear || "",
    description:
      equipmentData?.description || "",
    imageUrls:
      equipmentData?.imageUrls || [],
    newImages: []

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
              const files = Array.from(e.target.files);
              const valid = files.filter(file => {
                if (file.size > 2 * 1024 * 1024) {
                  toast.error(file.name + " quá 2MB");
                  return false;
                }
                return true;
              });
              setFieldValue(
                "newImages",
                [
                  ...values.newImages,
                  ...valid
                ]
              );
            }

            const triggerFileSelect = () => {
              fileInputRef.current.click();
            };
            const removeOldImage = (index) => {
              setFieldValue(
                "imageUrls",
                values.imageUrls.filter((_, i) => i !== index)

              );
            }
            const removeNewImage = (index) => {
              setFieldValue(
                "newImages",
                values.newImages.filter((_, i) => i !== index)

              );

            }

            return (
              <FormikForm onSubmit={handleSubmit}>
                {/* Upload Image Section */}
                <div className="image-upload-row">
                  <div
                    className="image-upload-dropzone"
                    onClick={triggerFileSelect}
                  >
                    <input
                      multiple
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="d-none"
                      onChange={handleImageChange} />
                    <BsCloudUpload className="image-upload-icon" />
                    <span className="fw-semibold">Kéo thả ảnh hoặc</span>
                    <span className="text-primary fw-bold" style={{ textDecoration: 'underline' }}>Chọn ảnh</span>
                    <span className="text-muted small mt-1">PNG, JPG, JPEG (tối đa 2MB)</span>
                  </div>
                  <div className="d-flex flex-wrap gap-3">

                    {values.imageUrls.map((url, index) => (

                      <div
                        key={index}
                        className="position-relative"
                      >

                        <img
                          src={url}
                          width={150}
                          height={150}
                          className="rounded border"
                          style={{ objectFit: "cover" }}
                        />

                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeOldImage(index)}
                        >
                          <BsX />
                        </Button>

                      </div>

                    ))}

                    {values.newImages.map((file, index) => (
                      <div
                        key={index}
                        className="position-relative"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          width={150}
                          height={150}
                          className="rounded border"
                          style={{ objectFit: "cover" }}
                        />
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeNewImage(index)}
                        >
                          <BsX />
                        </Button>
                      </div>
                    ))}
                  </div>

                </div>

                <Row className="g-4">
                  {/* Mã KKS */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Mã KKS</Form.Label>
                      <Form.Control
                        plaintext
                        readOnly
                        defaultValue={equipmentData?.kksCode}
                      />
                    </Form.Group>
                  </Col>

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

                  {/* Hệ thống */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Hệ thống</Form.Label>

                      <Form.Control
                        type="text"
                        value={equipmentData?.systemName || ""}
                        readOnly
                        disabled
                      />
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
                        isInvalid={
                          touched.equipmentTypeId &&
                          !!errors.equipmentTypeId
                        }
                      >
                        <option value="">Chọn loại thiết bị</option>

                        {equipmentTypes.map(type => (
                          <option
                            key={type.id}
                            value={type.id}
                          >
                            {type.name}
                          </option>
                        ))}
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
                        value={values.installationYear}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={
                          touched.installationYear &&
                          !!errors.installationYear
                        }
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
