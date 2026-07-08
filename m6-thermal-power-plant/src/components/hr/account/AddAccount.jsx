import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsSave, BsShieldLock, BsArrowClockwise } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { accountService } from '../../../services/hr/accountService';
import { employeeService } from '../../../services/hr/employeeService';
import PageHeader from '../../common/PageHeader';
import './style/AddAccount.css';

const AccountSchema = Yup.object().shape({
  username: Yup.string()
    .required('Vui lòng nhập tên đăng nhập')
    .min(8, 'Tên đăng nhập phải chứa từ 8 đến 50 ký tự')
    .max(50, 'Tên đăng nhập phải chứa từ 8 đến 50 ký tự')
    .matches(
      /^(?=.*[a-z])(?=.*[0-9])[a-z0-9]+$/,
      'Tên đăng nhập chỉ gồm chữ thường, chữ số và phải có ít nhất 1 chữ cái và 1 chữ số'
    ),
  roleIds: Yup.string()
    .required('Vui lòng chọn vai trò'),
  accountType: Yup.string(),
  employeeId: Yup.string().when('accountType', {
    is: 'INTERNAL',
    then: () => Yup.string().required('Vui lòng chọn nhân viên')
  }),
  email: Yup.string().when('accountType', {
    is: 'EXTERNAL',
    then: () => Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email')
  })
});

export default function AddAccount({ onCancel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const isEditMode = Boolean(idParam);
  
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async () => {
    if (!idParam) return;
    if (!window.confirm("Bạn có chắc chắn muốn cấp lại mật khẩu cho tài khoản này không? Mật khẩu mới sẽ được gửi về email đăng ký.")) {
      return;
    }
    setResetting(true);
    try {
      await accountService.resetPassword(idParam);
      toast.success("Cấp lại mật khẩu thành công! Mật khẩu mới đã được gửi tới email của tài khoản.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cấp lại mật khẩu thất bại");
    } finally {
      setResetting(false);
    }
  };

  const [initialValues, setInitialValues] = useState({
    username: '',
    accountType: 'INTERNAL',
    employeeId: '',
    email: '',
    roleIds: ''
  });

  useEffect(() => {
    Promise.all([
        accountService.getRoles(),
        employeeService.getAll()
    ]).then(([rolesRes, empRes]) => {
        setRoles(rolesRes.data?.data || rolesRes.data || []);
        setEmployees(empRes.data?.data || empRes.data || []);
    });

    if (isEditMode) {
      if (location.state?.initialData) {
        const data = location.state.initialData;
        setInitialValues({
          username: data.username || '',
          accountType: data.employee ? 'INTERNAL' : 'EXTERNAL',
          employeeId: data.employee?.id || '',
          email: data.email || '',
          roleIds: data.roles?.[0]?.id || ''
        });
      } else {
        setLoading(true);
        accountService.getById(idParam)
          .then((res) => {
            const data = res.data?.data || res.data;
            if (data) {
              setInitialValues({
                username: data.username || '',
                accountType: data.employee ? 'INTERNAL' : 'EXTERNAL',
                employeeId: data.employee?.id || '',
                email: data.email || '',
                roleIds: data.roles?.[0]?.id || ''
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
      const payload = {
        username: values.username,
        roleIds: [parseInt(values.roleIds)]
      };

      if (values.accountType === 'INTERNAL') {
          payload.employeeId = parseInt(values.employeeId);
      } else {
          payload.email = values.email;
      }

      if (isEditMode) {
        await accountService.update(idParam, payload);
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await accountService.create(payload);
        toast.success('Thêm tài khoản mới thành công');
      }
      
      if (onCancel) {
        onCancel();
      } else {
        navigate('/hr/accounts');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/hr/accounts');
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
          subtitle={isEditMode ? 'Chỉnh sửa quyền và thông tin đăng nhập' : 'Tạo mới tài khoản cho nhân sự hoặc đối tác'}
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
            setFieldValue,
            isSubmitting,
          }) => (
            <FormikForm onSubmit={handleSubmit} className="account-form">
              <Row className="mb-4">
                <Col md={12}>
                    <Form.Group>
                        <Form.Label className="required">Loại tài khoản</Form.Label>
                        <div>
                            <Form.Check 
                                inline
                                type="radio"
                                label="Tài khoản nội bộ (Chọn nhân sự)"
                                name="accountType"
                                value="INTERNAL"
                                checked={values.accountType === 'INTERNAL'}
                                onChange={handleChange}
                                disabled={isEditMode}
                            />
                            <Form.Check 
                                inline
                                type="radio"
                                label="Tài khoản ngoài (Nhập Email)"
                                name="accountType"
                                value="EXTERNAL"
                                checked={values.accountType === 'EXTERNAL'}
                                onChange={handleChange}
                                disabled={isEditMode}
                            />
                        </div>
                    </Form.Group>
                </Col>
              </Row>

              <Row className="g-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="username" className="required">
                      Tên đăng nhập
                    </Form.Label>
                    <Form.Control
                      id="username"
                      name="username"
                      type="text"
                      placeholder="VD: annguyen26"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.username && errors.username}
                      disabled={isEditMode}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.username}
                    </Form.Control.Feedback>
                    {isEditMode && <Form.Text className="text-muted">Không thể thay đổi tên đăng nhập sau khi tạo.</Form.Text>}
                  </Form.Group>
                </Col>

                {values.accountType === 'INTERNAL' && (
                    <Col md={6}>
                    <Form.Group>
                        <Form.Label htmlFor="employeeId" className="required">
                        Nhân viên
                        </Form.Label>
                        <Form.Select
                        id="employeeId"
                        name="employeeId"
                        value={values.employeeId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.employeeId && errors.employeeId}
                        disabled={isEditMode}
                        >
                        <option value="">— Chọn nhân viên —</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                        ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                        {errors.employeeId}
                        </Form.Control.Feedback>
                    </Form.Group>
                    </Col>
                )}

                {values.accountType === 'EXTERNAL' && (
                    <Col md={6}>
                    <Form.Group>
                        <Form.Label htmlFor="email" className="required">
                        Email
                        </Form.Label>
                        <Form.Control
                        id="email"
                        name="email"
                        type="email"
                        placeholder="VD: email@example.com"
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
                )}

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="roleIds" className="required">
                      Vai trò
                    </Form.Label>
                    <Form.Select
                      id="roleIds"
                      name="roleIds"
                      value={values.roleIds}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.roleIds && errors.roleIds}
                    >
                        <option value="">— Chọn vai trò —</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.roleIds}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <hr className="my-5 opacity-25" />

              <div className="d-flex justify-content-end gap-3 mt-4">
                {isEditMode && (
                  <Button
                    variant="outline-warning"
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isSubmitting || resetting}
                    className="me-auto d-inline-flex align-items-center gap-2"
                  >
                    {resetting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        Đang cấp lại...
                      </>
                    ) : (
                      <>
                        <BsArrowClockwise />
                        Cấp lại mật khẩu
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="light" 
                  onClick={handleCancelClick}
                  disabled={isSubmitting || resetting}
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
