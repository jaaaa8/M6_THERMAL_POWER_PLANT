import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BsX, BsKey, BsEye, BsEyeSlash, BsEnvelopeAt } from 'react-icons/bs';
import { authService } from '../../services/authService';

/** Giây phải đợi giữa 2 lần xin mã — khớp RESEND_COOLDOWN ở PasswordOtpService. */
const RESEND_COOLDOWN = 60;

export default function ChangePasswordModal({ show, onClose }) {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errors, setErrors] = useState({});
  const timerRef = useRef(null);

  // Dọn interval khi modal đóng / component unmount — không dọn thì đếm ngược
  // chạy tiếp dưới nền và setState vào component đã gỡ.
  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setErrors({});
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    clearInterval(timerRef.current);
    setCooldown(0);
    if (onClose) onClose();
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const maskedEmail = await authService.requestChangePasswordOtp();
      toast.success(`Đã gửi mã xác nhận tới ${maskedEmail}. Mã có hiệu lực 5 phút.`);
      startCooldown();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không gửi được mã xác nhận.';
      toast.error(msg, { autoClose: 8000 });
    } finally {
      setSendingOtp(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!oldPassword) {
      errs.oldPassword = 'Mật khẩu cũ không được để trống';
    }
    if (!newPassword) {
      errs.newPassword = 'Mật khẩu mới không được để trống';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Mật khẩu mới phải từ 6 ký tự trở lên';
    } else if (newPassword === oldPassword) {
      errs.newPassword = 'Mật khẩu mới không được trùng với mật khẩu cũ';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Xác nhận mật khẩu mới không được để trống';
    } else if (confirmPassword !== newPassword) {
      errs.confirmPassword = 'Xác nhận mật khẩu mới không trùng khớp';
    }

    if (!otp) {
      errs.otp = 'Mã xác nhận không được để trống';
    } else if (!/^\d{6}$/.test(otp)) {
      errs.otp = 'Mã xác nhận gồm đúng 6 chữ số';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword, otp);
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      onClose();
      // Thực hiện logout và chuyển hướng
      setTimeout(async () => {
        await authService.logout();
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Đổi mật khẩu không thành công.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <Modal 
      show={show} 
      onHide={onClose}
      centered
      backdrop="static"
      className="change-password-modal"
    >
      <Modal.Header className="border-0 pb-0">
        <h5 className="modal-title ms-3 mt-2 text-primary fw-bold d-flex align-items-center gap-2">
          <BsKey size={22} /> Đổi mật khẩu
        </h5>
        <Button 
          variant="light" 
          className="btn-icon-only rounded-circle ms-auto" 
          onClick={handleClose}
          disabled={loading}
        >
          <BsX size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        <Form onSubmit={handleSubmit} noValidate>
          {/* Old Password */}
          <Form.Group className="mb-3">
            <Form.Label className="fs-7 fw-semibold text-secondary">Mật khẩu cũ <span className="text-danger">*</span></Form.Label>
            <div className="position-relative">
              <Form.Control 
                type={showOld ? 'text' : 'password'}
                placeholder="Nhập mật khẩu cũ"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (errors.oldPassword) {
                    setErrors(prev => ({ ...prev, oldPassword: null }));
                  }
                }}
                isInvalid={!!errors.oldPassword}
                disabled={loading}
                className="pe-5"
              />
              <button 
                type="button"
                className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent px-3 text-secondary"
                onClick={() => setShowOld(!showOld)}
                disabled={loading}
              >
                {showOld ? <BsEyeSlash size={16} /> : <BsEye size={16} />}
              </button>
            </div>
            {errors.oldPassword && (
              <div className="invalid-feedback d-block mt-1">
                {errors.oldPassword}
              </div>
            )}
          </Form.Group>

          {/* New Password */}
          <Form.Group className="mb-3">
            <Form.Label className="fs-7 fw-semibold text-secondary">Mật khẩu mới <span className="text-danger">*</span></Form.Label>
            <div className="position-relative">
              <Form.Control 
                type={showNew ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors(prev => ({ ...prev, newPassword: null }));
                  }
                }}
                isInvalid={!!errors.newPassword}
                disabled={loading}
                className="pe-5"
              />
              <button 
                type="button"
                className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent px-3 text-secondary"
                onClick={() => setShowNew(!showNew)}
                disabled={loading}
              >
                {showNew ? <BsEyeSlash size={16} /> : <BsEye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <div className="invalid-feedback d-block mt-1">
                {errors.newPassword}
              </div>
            )}
          </Form.Group>

          {/* Confirm Password */}
          <Form.Group className="mb-4">
            <Form.Label className="fs-7 fw-semibold text-secondary">Xác nhận mật khẩu mới <span className="text-danger">*</span></Form.Label>
            <div className="position-relative">
              <Form.Control 
                type={showConfirm ? 'text' : 'password'}
                placeholder="Xác nhận lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: null }));
                  }
                }}
                isInvalid={!!errors.confirmPassword}
                disabled={loading}
                className="pe-5"
              />
              <button 
                type="button"
                className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent px-3 text-secondary"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={loading}
              >
                {showConfirm ? <BsEyeSlash size={16} /> : <BsEye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="invalid-feedback d-block mt-1">
                {errors.confirmPassword}
              </div>
            )}
          </Form.Group>

          {/* Mã OTP gửi qua email — lớp xác nhận thứ hai, không thay mật khẩu cũ */}
          <Form.Group className="mb-4">
            <Form.Label className="fs-7 fw-semibold text-secondary">
              Mã xác nhận <span className="text-danger">*</span>
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Nhập mã 6 số trong email"
                value={otp}
                onChange={(e) => {
                  // Chỉ nhận chữ số: dán từ email hay kèm khoảng trắng vẫn sạch.
                  setOtp(e.target.value.replace(/\D/g, ''));
                  if (errors.otp) setErrors((prev) => ({ ...prev, otp: null }));
                }}
                isInvalid={!!errors.otp}
                disabled={loading}
              />
              <Button
                variant="outline-primary"
                type="button"
                onClick={handleSendOtp}
                disabled={loading || sendingOtp || cooldown > 0}
                style={{ minWidth: 130 }}
              >
                {sendingOtp ? (
                  <Spinner size="sm" animation="border" />
                ) : cooldown > 0 ? `Gửi lại (${cooldown}s)` : (
                  <>
                    <BsEnvelopeAt className="me-1" /> Gửi mã
                  </>
                )}
              </Button>
            </InputGroup>
            {errors.otp ? (
              <div className="invalid-feedback d-block mt-1">{errors.otp}</div>
            ) : (
              <Form.Text muted className="fs-7">
                Bấm &quot;Gửi mã&quot; để nhận mã xác nhận qua email. Mã có hiệu lực 5 phút.
              </Form.Text>
            )}
          </Form.Group>

          {/* Actions */}
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={handleClose}
              disabled={loading}
              className="px-4"
            >
              Hủy
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
              className="px-4"
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Đang cập nhật...
                </>
              ) : 'Xác nhận'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
