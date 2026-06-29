import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { BsExclamationTriangleFill, BsTrash } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { employeeService } from '../../../services/employeeService';
import './style/DeleteEmployee.css';

export default function DeleteEmployee({ data, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  if (!data) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await employeeService.remove(data.id);
      toast.success('Xoá nhân sự thành công!');
      onSuccess?.();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Có lỗi xảy ra khi xoá nhân sự';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={true} onHide={onClose} centered className="delete-employee-modal">
      <Modal.Body className="text-center p-4">
        <div className="delete-icon-wrapper mb-3">
          <BsExclamationTriangleFill className="delete-icon" />
        </div>
        <h4 className="mb-3">Xác nhận Xoá</h4>
        <p className="mb-4 text-secondary">
          Bạn có chắc chắn muốn xoá nhân sự <strong>{data.hoVaTen}</strong>?<br />
          Hành động này không thể hoàn tác.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Button variant="outline-secondary" onClick={onClose} disabled={loading} className="px-4">
            Huỷ bỏ
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading} className="px-4 d-flex align-items-center gap-2">
            <BsTrash />
            {loading ? 'Đang xoá...' : 'Xoá nhân sự'}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
