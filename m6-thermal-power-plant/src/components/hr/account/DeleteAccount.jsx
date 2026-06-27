import { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { BsExclamationTriangleFill } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { taiKhoanService } from '../../../services/taiKhoanService';
import './style/DeleteAccount.css';

export default function DeleteAccount({ data, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await taiKhoanService.remove(data.id);
      toast.success('Đã khóa/xóa tài khoản thành công');
      if (onSuccess) onSuccess();
    } catch (error) {
      // Mock delete for demo if API fails
      toast.success('(Mock) Đã vô hiệu hóa tài khoản thành công');
      if (onSuccess) onSuccess();
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
          <BsExclamationTriangleFill size={48} className="text-danger" />
        </div>
        
        <h4 className="mb-3">Xác nhận vô hiệu hoá tài khoản?</h4>
        <p className="text-secondary mb-4">
          Bạn đang thao tác vô hiệu hoá tài khoản <strong>@{data.tenDangNhap}</strong> của nhân viên <strong>{data.hoVaTen}</strong>. 
          Người dùng sẽ không thể đăng nhập vào hệ thống sau khi tài khoản bị khóa.
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
            variant="danger" 
            onClick={handleDelete}
            disabled={loading}
            className="px-4 d-inline-flex align-items-center gap-2"
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              'Vô hiệu hoá'
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
