import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsGearWideConnected } from 'react-icons/bs';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import * as systemService from "../../services/systemService";
import PageHeader from '../common/PageHeader';
import './style/EditSystem.css';

export default function EditSystem() {
  const { id } = useParams();
  console.log(id);
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState({
    code: "",
    name: "",
    description: "",
    status: "ACTIVE"
  });
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const res = await systemService.getById(id);
        const system = res.data;

        setInitialValues({
          code: system.code,
          name: system.name,
          description: system.description || "",
          status: system.status,
        });

      } catch (err) {
        console.log(err);
        toast.error("Không tìm thấy hệ thống");
        navigate("/equipment/system");
      } finally {
        setLoading(false);
      }
    };

    fetchSystem();
  }, [id]);

  // Validation Schema với Yup
  const systemSchema = Yup.object({

    name: Yup.string()
      .trim()
      .matches(
        /^[A-ZÀ-Ỹ][A-Za-zÀ-ỹ0-9\s]*$/,
        "Tên hệ thống phải bắt đầu bằng chữ cái viết hoa"
      )
      .required("Tên hệ thống là bắt buộc"),

    status: Yup.string()
      .required("Trạng thái là bắt buộc"),

    description: Yup.string()
      .max(500, "Mô tả không quá 500 ký tự")

  });

  const handleSubmit = async (values, { setSubmitting }) => {

    try {

      const body = {
        name: values.name,
        description: values.description,
        status: values.status
      };

      await systemService.update(id, body);

      toast.success("Cập nhật thành công");

      navigate("/equipment/system");

    } catch (err) {

      console.log(err);

      toast.error(
        err.response?.data?.message || "Cập nhật thất bại"
      );

    } finally {

      setSubmitting(false);

    }
  };

  return (
    <div className="edit-system-container animate-fade-in">
      <PageHeader
        title="Chỉnh sửa Hệ thống"
        subtitle="Cập nhật các thông số vận hành và mô tả hệ thống"
        icon={<BsGearWideConnected />}
      />

      <div className="system-form-card">
        <Formik
          initialValues={initialValues}
          validationSchema={systemSchema}
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
          }) => (
            <FormikForm onSubmit={handleSubmit}>
              <Row className="g-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="code" className="fw-semibold">
                      Mã hệ thống <span style={{ color: "red" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      id="code"
                      name="code"
                      type="text"
                      value={values.code}
                      disabled
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="name" className="required">
                      Tên hệ thống
                    </Form.Label>
                    <Form.Control
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Nhập tên hệ thống..."
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
                      <option value="ACTIVE">
                        Hoạt động
                      </option>

                      <option value="MAINTENANCE">
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
                      placeholder="Nhập mô tả hoạt động..."
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
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật'
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
