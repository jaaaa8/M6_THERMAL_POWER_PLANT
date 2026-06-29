import { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';
import { BsPersonCheck } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { accountService } from '../../../services/hr/accountService';

export default function GrantAccountModal({ data, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    accountService.getRoles()
      .then(res => {
        const list = res.data?.data || res.data || [];
        setRoles(Array.isArray(list) ? list : []);
        if (list.length > 0) {
            setSelectedRole(list[0].id);
        }
      })
      .catch(() => toast.error('Không thể tải danh sách vai trò'));
  }, []);

  const handleGrant = async () => {
    if (!selectedRole) {
        toast.warning('Vui lòng chọn vai trò');
        return;
    }
    setLoading(true);
    try {
      // Pass data.id. If data.id is missing from API, you must update the backend to include id in EmployeeAccountDTO
      await accountService.grantRole({
        employeeId: data.id,
        roleId: parseInt(selectedRole)
      });
      toast.success(`Đã cấp tài khoản cho nhân viên ${data.fullName}`);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra khi cấp tài khoản');
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
        
        <h4 className="mb-3">Cấp tài khoản đăng nhập</h4>
        <p className="text-secondary mb-4">
          Cấp tài khoản đăng nhập cho nhân viên <strong>{data.fullName}</strong>.
          <br/>Tên đăng nhập mặc định sẽ là Email của nhân viên.
        </p>

        <Form.Group className="mb-4 text-start">
            <Form.Label>Chọn vai trò</Form.Label>
            <Form.Select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading}
            >
                {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                ))}
            </Form.Select>
        </Form.Group>

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
            disabled={loading || !selectedRole}
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
