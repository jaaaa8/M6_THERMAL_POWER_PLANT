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
 * Chuyển hướng dựa theo Role
 */
const ROLE_REDIRECT = {
  ADMIN: '/admin/phan-quyen',
  TRUONG_CA: '/sua-chua/yeu-cau',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const res = await authService.login(values.username, values.password);
      const user = res.data;

      toast.success(`Xin chào, ${user.hoTen}!`);

      // Chuyển hướng theo Role
      const redirectPath = ROLE_REDIRECT[user.role] || '/';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
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

            {/* Hint cho dev/demo */}
            <div style={{
              marginTop: 'var(--space-5)',
              padding: 'var(--space-3)',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'rgba(255,255,255,0.35)',
                margin: 0,
                lineHeight: 1.6,
              }}>
                <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Demo accounts:</strong><br />
                <code style={{ color: 'var(--color-accent)', fontSize: 'var(--text-xs)' }}>admin / admin123</code> → Quản trị viên<br />
                <code style={{ color: 'var(--color-accent)', fontSize: 'var(--text-xs)' }}>truongca / truongca123</code> → Trưởng ca
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
