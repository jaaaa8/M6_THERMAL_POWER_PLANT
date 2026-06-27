import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsSave, BsShieldLock } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { taiKhoanService } from '../../../services/taiKhoanService';
import PageHeader from '../../common/PageHeader';
import './style/AddAccount.css';

const AccountSchema = Yup.object().shape({
  tenDangNhap: Yup.string()
    .required('Vui lòng nhập tên đăng nhập')
    .min(3, 'Tên đăng nhập ít nhất 3 ký tự'),
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập email'),
  hoVaTen: Yup.string()
    .required('Vui lòng nhập họ và tên'),
  vaiTro: Yup.string()
    .required('Vui lòng chọn vai trò'),
  trangThai: Yup.string()
    .required('Vui lòng chọn trạng thái')
});

export default function AddAccount({ onCancel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const isEditMode = Boolean(idParam);
  
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({
    tenDangNhap: '',
    email: '',
    hoVaTen: '',
    vaiTro: 'NHAN_VIEN',
    trangThai: 'HOAT_DONG'
  });

  useEffect(() => {
    if (isEditMode) {
      if (location.state?.initialData) {
        const data = location.state.initialData;
        setInitialValues({
          tenDangNhap: data.tenDangNhap || '',
          email: data.email || '',
          hoVaTen: data.hoVaTen || '',
          vaiTro: data.vaiTro || 'NHAN_VIEN',
          trangThai: data.trangThai || 'HOAT_DONG'
        });
      } else {
        setLoading(true);
        taiKhoanService.getById(idParam)
          .then((res) => {
            const data = res.data?.data || res.data;
            if (data) {
              setInitialValues({
                tenDangNhap: data.tenDangNhap || '',
                email: data.email || '',
                hoVaTen: data.hoVaTen || '',
                vaiTro: data.vaiTro || 'NHAN_VIEN',
                trangThai: data.trangThai || 'HOAT_DONG'
              });
            }
          })
          .catch(() => toast.error('Không tải được thông tin tài khoản'))
          .finally(() => setLoading(false));
      }
    }
  }, [idParam, isEditMode, location.state]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isEditMode) {
        await taiKhoanService.update(idParam, values);
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await taiKhoanService.create(values);
        toast.success('Thêm tài khoản mới thành công');
      }
      
      if (onCancel) {
        onCancel();
      } else {
        navigate('/nhan-su/tai-khoan');
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
      navigate('/nhan-su/tai-khoan');
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
    <div className="add-account-container animate-fade-in">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button 
          variant="light" 
          className="btn-icon-only rounded-circle"
          onClick={handleCancelClick}
        >
          <BsArrowLeft />
        </Button>
        <PageHeader 
          title={isEditMode ? 'Cập nhật Tài khoản' : 'Thêm Tài khoản mới'} 
          subtitle={isEditMode ? 'Chỉnh sửa quyền và thông tin đăng nhập' : 'Tạo mới tài khoản cho nhân sự'}
          className="mb-0"
        />
      </div>

      <div className="surface-card p-4">
        <div className="form-section-title mb-4 pb-2 border-bottom">
          <BsShieldLock className="me-2 text-primary" />
          Thông tin bảo mật
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={AccountSchema}
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
            <FormikForm onSubmit={handleSubmit} className="account-form">
              <Row className="g-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="tenDangNhap" className="required">
                      Tên đăng nhập
                    </Form.Label>
                    <Form.Control
                      id="tenDangNhap"
                      name="tenDangNhap"
                      type="text"
                      placeholder="VD: an.nguyen"
                      value={values.tenDangNhap}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.tenDangNhap && errors.tenDangNhap}
                      disabled={isEditMode}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.tenDangNhap}
                    </Form.Control.Feedback>
                    {isEditMode && <Form.Text className="text-muted">Không thể thay đổi tên đăng nhập sau khi tạo.</Form.Text>}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="hoVaTen" className="required">
                      Họ và tên
                    </Form.Label>
                    <Form.Control
                      id="hoVaTen"
                      name="hoVaTen"
                      type="text"
                      placeholder="Nhập họ và tên..."
                      value={values.hoVaTen}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.hoVaTen && errors.hoVaTen}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.hoVaTen}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="email" className="required">
                      Email liên hệ
                    </Form.Label>
                    <Form.Control
                      id="email"
                      name="email"
                      type="email"
                      placeholder="VD: email@powerplant.vn"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.email && errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="vaiTro" className="required">
                      Vai trò
                    </Form.Label>
                    <Form.Select
                      id="vaiTro"
                      name="vaiTro"
                      value={values.vaiTro}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.vaiTro && errors.vaiTro}
                    >
                      <option value="NHAN_VIEN">Nhân viên</option>
                      <option value="QUAN_LY_NS">Quản lý Nhân sự</option>
                      <option value="QUAN_TRI">Quản trị viên hệ thống</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.vaiTro}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="trangThai" className="required">
                      Trạng thái tài khoản
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
                      <option value="KHOA">Khóa tài khoản</option>
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
