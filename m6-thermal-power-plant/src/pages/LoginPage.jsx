import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import { speak, getWelcomeText } from '../utils/speak';
import './LoginPage.css';

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
 */
const ROLE_REDIRECT = {
  ADMIN: '/',
  WORKER: '/employee',
  MATERIALS_STOREKEEPER: '/material/catalog',
  TOOLS_STOREKEEPER: '/ccdc/muon-tra',
  WORKSHOP_FOREMAN: '/equipment/system',
  SHIFT_LEADER: '/repair/yeu-cau',
  CREW_LEADER: '/repair/yeu-cau',
  MAINTENANCE_FOREMAN: '/repair/phieu-cong-tac',
  TEAM_LEADER: '/repair/phieu-cong-tac',
  SAFETY_SUPERVISOR: '/repair/phieu-cong-tac',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const res = await authService.login(values.username, values.password);
      const user = res.data;

      const welcome = getWelcomeText(user);
      toast.success(welcome, { autoClose: 6000 });
      speak(welcome);

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
    <div className="login-card-container">
      <div className="heading">Sign In</div>
      <Formik
        initialValues={{ username: '', password: '' }}
        validationSchema={loginSchema}
        onSubmit={handleLogin}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit} noValidate className="form">
            <div className="input-wrapper">
              <input
                required
                className={`input ${touched.username && errors.username ? 'is-invalid' : ''}`}
                type="text"
                name="username"
                id="username"
                placeholder="Tên đăng nhập"
                value={values.username}
                onChange={handleChange}
                onBlur={handleBlur}
                autoFocus
                autoComplete="username"
              />
              {touched.username && errors.username && (
                <div className="error-message">{errors.username}</div>
              )}
            </div>

            <div className="input-wrapper">
              <input
                required
                className={`input ${touched.password && errors.password ? 'is-invalid' : ''}`}
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                placeholder="Mật khẩu"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password"
              >
                {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
              </button>
              {touched.password && errors.password && (
                <div className="error-message">{errors.password}</div>
              )}
            </div>



            <input
              className="login-button"
              type="submit"
              value={isSubmitting ? 'Đang đăng nhập...' : 'Sign In'}
              disabled={isSubmitting}
            />
          </form>
        )}
      </Formik>

      <div className="social-account-container">
        <span className="title">Or Sign in with</span>
        <div className="social-accounts">
          <button type="button" className="social-button google" title="Google">
            <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 488 512">
              <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
            </svg>
          </button>
          <button type="button" className="social-button apple" title="Apple">
            <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
          </button>
          <button type="button" className="social-button twitter" title="Twitter / X">
            <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
              <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
            </svg>
          </button>
        </div>
      </div>
      <span className="agreement">
        <a href="#">Learn user licence agreement</a>
      </span>
    </div>
  );
}
