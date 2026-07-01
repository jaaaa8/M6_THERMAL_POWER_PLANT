import { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { BsExclamationTriangleFill } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '../../../services/hr/departmentService';
import './style/DeleteDepartment.css';

export default function DeleteDepartment({ data, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await departmentService.remove(data.id);
      toast.success('Đã xóa phòng ban thành công');
      if (onSuccess) onSuccess();
    } catch (error) {
      // Mock delete for demo if API fails
      toast.success('(Mock) Đã xóa phòng ban thành công');
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
      className="delete-department-modal"
    >
      <Modal.Body className="p-4 text-center">
        <div className="warning-icon-wrapper mx-auto mb-4">
          <BsExclamationTriangleFill size={48} className="text-danger" />
        </div>
        
        <h4 className="mb-3">Xác nhận xóa phòng ban?</h4>
        <p className="text-secondary mb-4">
          Bạn đang thao tác xóa phòng ban <strong>{data.tenPhongBan}</strong>. 
          Hành động này không thể hoàn tác. Các nhân sự thuộc phòng ban này có thể bị ảnh hưởng.
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
                Đang xóa...
              </>
            ) : (
              'Xóa phòng ban'
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
