import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  BsPersonPlus,
  BsEye,
  BsEyeSlash,
  BsArrowClockwise,
  BsCheckCircle,
  BsShieldCheck,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import ConfirmModal from '../components/common/ConfirmModal';
import { authService } from '../services/authService';
import { SYSTEM_ROLES } from '../services/roleService';
import './CreateAccountPage.css';

/**
 * Schema validation cho form tạo tài khoản.
 * Đồng bộ với BE validation: username @NotBlank, password ≥ 6 ký tự.
 */
const createAccountSchema = Yup.object({
  username: Yup.string()
    .required('Vui lòng nhập tên đăng nhập')
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự')
    .matches(
      /^[a-zA-Z0-9!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+$/,
      'Chỉ chấp nhận chữ cái, số và các ký tự đặc biệt'
    ),
  password: Yup.string()
    .required('Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: Yup.string()
    .required('Vui lòng xác nhận mật khẩu')
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp'),
  roleNames: Yup.array()
    .of(Yup.string())
    .min(1, 'Vui lòng chọn ít nhất 1 vai trò'),
});

const initialValues = {
  username: '',
  password: '',
  confirmPassword: '',
  roleNames: [],
};

export default function CreateAccountPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [pendingResetForm, setPendingResetForm] = useState(null);
  const [successFlash, setSuccessFlash] = useState(false);

  /**
   * Mở confirm modal trước khi submit.
   */
  const handlePreSubmit = (values, { resetForm }) => {
    setPendingValues(values);
    setPendingResetForm(() => resetForm);
    setShowConfirmModal(true);
  };

  /**
   * Gọi API tạo tài khoản sau khi confirm.
   */
  const handleConfirmCreate = async () => {
    if (!pendingValues) return;

    try {
      setSubmitting(true);
      await authService.createAccount({
        username: pendingValues.username,
        password: pendingValues.password,
        roleNames: pendingValues.roleNames,
      });

      toast.success(
        `Tạo tài khoản "${pendingValues.username}" thành công!`
      );

      // Flash animation
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 500);

      // Reset form
      if (pendingResetForm) {
        pendingResetForm();
      }
    } catch (err) {
      const errorCode = err.response?.data?.errorCode;
      const message = err.response?.data?.message;

      switch (errorCode) {
        case 'DUPLICATE_RESOURCE':
          toast.error(message || 'Tên đăng nhập đã tồn tại trong hệ thống!');
          break;
        case 'NOT_FOUND':
          toast.error(message || 'Hệ thống không tìm thấy role được chọn');
          break;
        case 'FORBIDDEN':
          toast.error(message || 'Bạn không có quyền thực hiện hành động này');
          break;
        case 'VALIDATION_ERROR':
          toast.error(message || 'Dữ liệu không hợp lệ');
          break;
        default:
          toast.error(message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
      setPendingValues(null);
      setPendingResetForm(null);
    }
  };

  /**
   * Toggle role trong mảng roleNames (Formik field).
   */
  const toggleRole = (roleCode, currentRoles, setFieldValue) => {
    const updated = currentRoles.includes(roleCode)
      ? currentRoles.filter((r) => r !== roleCode)
      : [...currentRoles, roleCode];
    setFieldValue('roleNames', updated);
  };

  return (
    <div>
      <PageHeader
        title="Tạo tài khoản mới"
        subtitle="Tạo tài khoản đăng nhập và phân quyền cho nhân viên"
        icon={<BsPersonPlus />}
      />

      <div className={`create-account-card ${successFlash ? 'success-flash' : ''}`}>
        {/* Card Header */}
        <div className="create-account-card-header">
          <div className="create-account-card-header-icon">
            <BsShieldCheck />
          </div>
          <div className="create-account-card-header-text">
            <h2>Thông tin tài khoản</h2>
            <p>Điền đầy đủ thông tin bên dưới để tạo tài khoản mới</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="create-account-card-body">
          <Formik
            initialValues={initialValues}
            validationSchema={createAccountSchema}
            onSubmit={handlePreSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              resetForm,
              dirty,
            }) => (
              <Form onSubmit={handleSubmit} noValidate>
                {/* Username */}
                <div className="create-account-form-group">
                  <label htmlFor="create-username">
                    Tên đăng nhập <span className="required-mark">*</span>
                  </label>
                  <Form.Control
                    id="create-username"
                    type="text"
                    name="username"
                    placeholder="Ví dụ: nhanvien_01"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.username && !!errors.username}
                    autoComplete="off"
                    autoFocus
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                  {!errors.username && (
                    <span className="create-account-input-hint">
                      Chỉ chấp nhận chữ cái, số và dấu gạch dưới (_)
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="create-account-form-group">
                  <label htmlFor="create-password">
                    Mật khẩu <span className="required-mark">*</span>
                  </label>
                  <div className="create-account-password-wrapper">
                    <Form.Control
                      id="create-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Tối thiểu 6 ký tự"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.password && !!errors.password}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="create-account-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      tabIndex={-1}
                    >
                      {showPassword ? <BsEyeSlash /> : <BsEye />}
                    </button>
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="create-account-form-group">
                  <label htmlFor="create-confirm-password">
                    Xác nhận mật khẩu <span className="required-mark">*</span>
                  </label>
                  <div className="create-account-password-wrapper">
                    <Form.Control
                      id="create-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Nhập lại mật khẩu"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={
                        touched.confirmPassword && !!errors.confirmPassword
                      }
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="create-account-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label="Toggle confirm password visibility"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <BsEyeSlash /> : <BsEye />}
                    </button>
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </div>
                </div>

                {/* Divider */}
                <div className="create-account-divider">Phân quyền vai trò</div>

                {/* Roles */}
                <div className="create-account-roles-section">
                  <div className="create-account-roles-label">
                    <span>
                      Chọn vai trò <span className="required-mark">*</span>
                    </span>
                    <span
                      className={`create-account-roles-count ${
                        values.roleNames.length > 0 ? 'has-selection' : ''
                      }`}
                    >
                      {values.roleNames.length} / {SYSTEM_ROLES.length}
                    </span>
                  </div>

                  <div className="create-account-roles-grid">
                    {SYSTEM_ROLES.map((role) => {
                      const isSelected = values.roleNames.includes(
                        role.roleCode
                      );
                      return (
                        <div
                          key={role.id}
                          className={`create-account-role-item ${
                            isSelected ? 'selected' : ''
                          }`}
                          onClick={() =>
                            toggleRole(
                              role.roleCode,
                              values.roleNames,
                              setFieldValue
                            )
                          }
                        >
                          <Form.Check
                            type="checkbox"
                            id={`role-${role.roleCode}`}
                            checked={isSelected}
                            onChange={() =>
                              toggleRole(
                                role.roleCode,
                                values.roleNames,
                                setFieldValue
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="create-account-role-info">
                            <span className="create-account-role-name">
                              {role.roleName}
                            </span>
                            <span className="create-account-role-code">
                              {role.roleCode}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {touched.roleNames && errors.roleNames && (
                    <div className="create-account-roles-error">
                      {errors.roleNames}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="create-account-actions">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    type="button"
                    onClick={() => resetForm()}
                    disabled={!dirty || submitting}
                  >
                    <BsArrowClockwise className="me-1" /> Đặt lại
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      'Đang tạo...'
                    ) : (
                      <>
                        <BsCheckCircle className="me-1" /> Tạo tài khoản
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        show={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingValues(null);
          setPendingResetForm(null);
        }}
        onConfirm={handleConfirmCreate}
        title="Xác nhận tạo tài khoản"
        message={
          pendingValues
            ? `Bạn có chắc chắn muốn tạo tài khoản "${pendingValues.username}" với ${pendingValues.roleNames.length} vai trò: ${pendingValues.roleNames
                .map(
                  (code) =>
                    SYSTEM_ROLES.find((r) => r.roleCode === code)?.roleName ||
                    code
                )
                .join(', ')}?`
            : ''
        }
        confirmText="Tạo tài khoản"
        variant="primary"
        loading={submitting}
      />
    </div>
  );
}
