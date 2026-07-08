import { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BsX, BsKey, BsEye, BsEyeSlash } from 'react-icons/bs';
import { authService } from '../../services/authService';

export default function ChangePasswordModal({ show, onClose }) {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
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
          className="btn-close-custom ms-auto" 
          onClick={onClose}
          disabled={loading}
        >
          <BsX size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        <Form onSubmit={handleSubmit}>
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
            <Form.Control.Feedback type="invalid">
              {errors.oldPassword}
            </Form.Control.Feedback>
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
            <Form.Control.Feedback type="invalid">
              {errors.newPassword}
            </Form.Control.Feedback>
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
            <Form.Control.Feedback type="invalid">
              {errors.confirmPassword}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Actions */}
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={onClose}
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
