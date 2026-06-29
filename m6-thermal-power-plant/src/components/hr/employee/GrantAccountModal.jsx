import { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { BsPersonCheck } from 'react-icons/bs';
import { toast } from 'react-toastify';

export default function GrantAccountModal({ data, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    setLoading(true);
    try {
      // Giả lập gọi API cấp tài khoản
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Đã cấp tài khoản cho nhân viên ${data.hoVaTen}`);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cấp tài khoản');
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
    >
      <Modal.Body className="p-4 text-center">
        <div className="mx-auto mb-4" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(var(--bs-success-rgb), 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BsPersonCheck size={48} className="text-success" />
        </div>
        
        <h4 className="mb-3">Xác nhận cấp tài khoản?</h4>
        <p className="text-secondary mb-4">
          Bạn đang thao tác cấp tài khoản đăng nhập cho nhân viên <strong>{data.hoVaTen}</strong>.
          <br/>Tên đăng nhập mặc định sẽ là Email của nhân viên.
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
            variant="success" 
            onClick={handleGrant}
            disabled={loading}
            className="px-4 d-inline-flex align-items-center gap-2"
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              'Cấp tài khoản'
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
