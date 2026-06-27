import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsGearWideConnected } from 'react-icons/bs';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { systemService } from '../../services/systemService';
import PageHeader from '../common/PageHeader';
import './style/AddSystem.css';

export default function AddSystem() {
  const navigate = useNavigate();

  // Validation Schema với Yup
  const systemSchema = Yup.object().shape({
    name: Yup.string()
      .required('Vui lòng nhập tên hệ thống')
      .matches(
        /^[A-Za-zÀ-ỹ].*$/,
        "Tên hệ thống phải bắt đầu bằng chữ cái.")
      .min(3, 'Tên hệ thống phải có tối thiểu 3 ký tự'),

    status: Yup.string()
      .required('Vui lòng chọn trạng thái hoạt động'),
    description: Yup.string().max(250, 'Mô tả không dài quá 250 ký tự'),
  });

  const initialValues = {
    name: '',
    status: 'ACTIVE',
    description: '',
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await systemService.create(values);
      toast.success('Thêm mới hệ thống thành công!');
      navigate('/equipment/system');
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Thêm mới hệ thống thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-system-container animate-fade-in">
      <PageHeader
        title="Thêm mới Hệ thống"
        subtitle="Khởi tạo thông tin hệ thống kỹ thuật mới trong nhà máy"
        icon={<BsGearWideConnected />}
      />

      <div className="system-form-card">
        <Formik
          initialValues={initialValues}
          validationSchema={systemSchema}
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
          }) => (
            <FormikForm onSubmit={handleSubmit}>
              <Row className="g-4">

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="name" className="required">
                      Tên hệ thống
                    </Form.Label>
                    <Form.Control
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Nhập tên hệ thống (VD: Hệ thống tuần hoàn)..."
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

                <Col md={4}>
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

                      <option value="MAINTENANCE">Bảo dưỡng
                        Bảo dưỡng
                      </option>

                      <option value="FAILURE">
                        Sự cố
                      </option>

                      <option value="STANDBY">
                        Dự phòng
                      </option>

                      <option value="RETIRED">
                        Thanh lý
                      </option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.status}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label htmlFor="description">
                      Mô tả chức năng
                    </Form.Label>
                    <Form.Control
                      id="description"
                      name="description"
                      as="textarea"
                      rows={4}
                      placeholder="Nhập mô tả hoạt động của hệ thống..."
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

              <div className="d-flex justify-content-end gap-3 mt-4 border-top pt-4">
                <Button
                  variant="light"
                  onClick={() => navigate('/equipment/system')}
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
          )}
        </Formik>
      </div>
    </div>
  );
}
