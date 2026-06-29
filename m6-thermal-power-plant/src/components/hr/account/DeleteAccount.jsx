import { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { BsExclamationTriangleFill } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { accountService } from '../../../services/hr/accountService';
import './style/DeleteAccount.css';

export default function DeleteAccount({ data, action, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const isLocking = action !== 'UNLOCK';

  const handleUpdateStatus = async () => {
    setLoading(true);
    try {
      await accountService.updateStatus({ username: data.username, status: isLocking ? 'LOCKED' : 'ACTIVE' });
      toast.success(`${isLocking ? 'Khoá' : 'Mở khoá'} tài khoản thành công`);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(`Có lỗi xảy ra khi ${isLocking ? 'khoá' : 'mở khoá'} tài khoản`);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  return (
    <Modal 
      show={true} 
      onHide={onClose}
      centered
      backdrop="static"
      className="delete-account-modal"
    >
      <Modal.Body className="p-4 text-center">
        <div className="warning-icon-wrapper mx-auto mb-4">
          <BsExclamationTriangleFill size={48} className={isLocking ? "text-danger" : "text-success"} />
        </div>
        
        <h4 className="mb-3">Xác nhận {isLocking ? 'khoá' : 'mở khoá'} tài khoản?</h4>
        <p className="text-secondary mb-4">
          Bạn đang thao tác {isLocking ? 'khoá' : 'mở khoá'} tài khoản <strong>{data.tenDangNhap || data.username}</strong>.
          <br/>Tài khoản {isLocking ? 'bị khoá sẽ không thể đăng nhập' : 'mở khoá sẽ có thể đăng nhập lại'} vào hệ thống.
        </p>

        <div className="d-flex justify-content-center gap-3">
          <Button 
            variant="light" 
            onClick={onClose}
            disabled={loading}
            className="px-4"
          >
            Hủy bỏ
          </Button>
          <Button 
            variant={isLocking ? "danger" : "success"} 
            onClick={handleUpdateStatus}
            disabled={loading}
            className="px-4 d-inline-flex align-items-center gap-2"
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              isLocking ? 'Khoá tài khoản' : 'Mở khoá tài khoản'
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
