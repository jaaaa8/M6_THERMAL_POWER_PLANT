import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BsBoxArrowInRight, BsEye, BsEyeSlash, BsShieldLock } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';

/**
 * Schema validation cho form đăng nhập
 */
const loginSchema = Yup.object({
  username: Yup.string()
    .required('Vui lòng nhập tên đăng nhập')
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
  password: Yup.string()
    .required('Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

/**
 * Chuyển hướng dựa theo Role backend — màn hình chủ của từng vai trò.
 * Áp dụng cho role đầu tiên trong mảng `roles[]` trả về từ BE.
 */
const ROLE_REDIRECT = {
  ADMIN: '/',
  WORKER: '/employee',
  MATERIALS_STOREKEEPER: '/materials',
  TOOLS_STOREKEEPER: '/tools',
  WORKSHOP_FOREMAN: '/equipment',
  SHIFT_LEADER: '/repair/requests',
  CREW_LEADER: '/repair/requests',
  MAINTENANCE_FOREMAN: '/repair/work-orders',
  TEAM_LEADER: '/repair/work-orders',
  SAFETY_SUPERVISOR: '/repair/work-orders',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const res = await authService.login(values.username, values.password);
      const user = res.data;

      toast.success(`Xin chào, ${user.fullName || user.username}!`);

      // Chuyển hướng theo role backend (lấy role đầu tiên).
      const primaryRole = user.roles?.[0];
      const redirectPath = ROLE_REDIRECT[primaryRole] || '/';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const message = apiMessage || 'Đăng nhập thất bại. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h2>
        <BsShieldLock className="me-2" style={{ fontSize: '1.2em', opacity: 0.7 }} />
        Đăng nhập
      </h2>

      <Formik
        initialValues={{ username: '', password: '' }}
        validationSchema={loginSchema}
        onSubmit={handleLogin}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Tên đăng nhập</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Nhập tên đăng nhập"
                value={values.username}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.username && !!errors.username}
                autoFocus
                autoComplete="username"
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Mật khẩu</Form.Label>
              <div style={{ position: 'relative' }}>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.password && !!errors.password}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    zIndex: 2,
                  }}
                  aria-label="Toggle password"
                >
                  {showPassword ? <BsEyeSlash /> : <BsEye />}
                </button>
                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
              </div>
            </Form.Group>

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                'Đang đăng nhập...'
              ) : (
                <>
                  <BsBoxArrowInRight className="me-2" />
                  Đăng nhập
                </>
              )}
            </Button>
          </Form>
        )}
      </Formik>
    </>
  );
}
