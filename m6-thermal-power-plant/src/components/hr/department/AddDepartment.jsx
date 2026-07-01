import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsSave, BsBuilding } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '../../../services/hr/departmentService';
import PageHeader from '../../common/PageHeader';
import './style/AddDepartment.css';

const DepartmentSchema = Yup.object().shape({
  tenPhongBan: Yup.string()
    .required('Vui lòng nhập tên phòng ban')
    .min(3, 'Tên quá ngắn, ít nhất 3 ký tự')
    .max(100, 'Tên quá dài, tối đa 100 ký tự'),
  moTa: Yup.string()
    .max(500, 'Mô tả quá dài, tối đa 500 ký tự'),
  trangThai: Yup.string()
    .required('Vui lòng chọn trạng thái')
});

export default function AddDepartment({ onCancel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const isEditMode = Boolean(idParam);
  
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({
    tenPhongBan: '',
    moTa: '',
    trangThai: 'HOAT_DONG'
  });

  useEffect(() => {
    if (isEditMode) {
      if (location.state?.initialData) {
        const data = location.state.initialData;
        setInitialValues({
          tenPhongBan: data.tenPhongBan || '',
          moTa: data.moTa || '',
          trangThai: data.trangThai || 'HOAT_DONG'
        });
      } else {
        // Fallback: Fetch từ API nếu không có data truyền sang
        setLoading(true);
        departmentService.getById(idParam)
          .then((res) => {
            const data = res.data?.data || res.data;
            if (data) {
              setInitialValues({
                tenPhongBan: data.tenPhongBan || '',
                moTa: data.moTa || '',
                trangThai: data.trangThai || 'HOAT_DONG'
              });
            }
          })
          .catch(() => toast.error('Không tải được thông tin phòng ban'))
          .finally(() => setLoading(false));
      }
    }
  }, [idParam, isEditMode, location.state]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isEditMode) {
        await departmentService.update(idParam, values);
        toast.success('Cập nhật thông tin thành công');
      } else {
        await departmentService.create(values);
        toast.success('Thêm phòng ban mới thành công');
      }
      
      if (onCancel) {
        onCancel();
      } else {
        navigate('/hr/departments');
      }
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/hr/departments');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="add-department-container animate-fade-in">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button 
          variant="light" 
          className="btn-icon-only rounded-circle"
          onClick={handleCancelClick}
        >
          <BsArrowLeft />
        </Button>
        <PageHeader 
          title={isEditMode ? 'Cập nhật Phòng ban' : 'Thêm Phòng ban mới'} 
          subtitle={isEditMode ? 'Chỉnh sửa thông tin phòng ban' : 'Điền thông tin để tạo mới'}
          className="mb-0"
        />
      </div>

      <div className="surface-card p-4">
        <div className="form-section-title mb-4 pb-2 border-bottom">
          <BsBuilding className="me-2 text-primary" />
          Thông tin cơ bản
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={DepartmentSchema}
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
            <FormikForm onSubmit={handleSubmit} className="department-form">
              <Row className="g-4">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label htmlFor="tenPhongBan" className="required">
                      Tên phòng ban
                    </Form.Label>
                    <Form.Control
                      id="tenPhongBan"
                      name="tenPhongBan"
                      type="text"
                      placeholder="Nhập tên phòng ban..."
                      value={values.tenPhongBan}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.tenPhongBan && errors.tenPhongBan}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.tenPhongBan}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label htmlFor="moTa">Mô tả</Form.Label>
                    <Form.Control
                      id="moTa"
                      name="moTa"
                      as="textarea"
                      rows={4}
                      placeholder="Nhập mô tả chức năng, nhiệm vụ..."
                      value={values.moTa}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.moTa && errors.moTa}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.moTa}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="trangThai" className="required">
                      Trạng thái
                    </Form.Label>
                    <Form.Select
                      id="trangThai"
                      name="trangThai"
                      value={values.trangThai}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.trangThai && errors.trangThai}
                    >
                      <option value="HOAT_DONG">Đang hoạt động</option>
                      <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.trangThai}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <hr className="my-5 opacity-25" />

              <div className="d-flex justify-content-end gap-3 mt-4">
                <Button 
                  variant="light" 
                  onClick={handleCancelClick}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={isSubmitting}
                  className="d-inline-flex align-items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <BsSave />
                      Lưu thông tin
                    </>
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
