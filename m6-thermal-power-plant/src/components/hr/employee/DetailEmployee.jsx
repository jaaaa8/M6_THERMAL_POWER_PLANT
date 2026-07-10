import { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Form, Spinner } from 'react-bootstrap';
import { BsX, BsPersonBadge, BsBriefcase, BsEnvelope, BsTelephone, BsShieldLock, BsPlusCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { employeeService } from '../../../services/hr/employeeService';
import { accountService } from '../../../services/hr/accountService';
import StatusBadge from '../../common/StatusBadge';
import './style/DetailEmployee.css';

export default function DetailEmployee({ data: initialData, onClose, onRefreshList }) {
  const [employee, setEmployee] = useState(initialData);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [granting, setGranting] = useState(false);

  // Fetch complete employee details from backend
  const fetchEmployeeDetails = async () => {
    if (!initialData?.id) return;
    setLoadingEmployee(true);
    try {
      const res = await employeeService.getById(initialData.id);
      setEmployee(res.data?.data || res.data);
    } catch (err) {
      toast.error('Không thể tải chi tiết nhân viên');
    } finally {
      setLoadingEmployee(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, [initialData?.id]);

  // Load roles list for inline grant form when employee doesn't have an account
  useEffect(() => {
    const hasAccount = employee?.account || employee?.username;
    if (!hasAccount) {
      accountService.getRoles()
        .then(res => {
          const list = res.data?.data || res.data || [];
          setRoles(Array.isArray(list) ? list : []);
          if (list.length > 0) {
            setSelectedRole(list[0].id);
          }
        })
        .catch(() => toast.error('Không thể tải danh sách vai trò'));
    }
  }, [employee]);

  const handleGrantAccount = async () => {
    if (!selectedRole) {
      toast.warning('Vui lòng chọn vai trò');
      return;
    }
    setGranting(true);
    try {
      await accountService.grantRole({
        employeeId: employee.id,
        roleId: parseInt(selectedRole)
      });
      toast.success(`Đã cấp tài khoản cho nhân viên ${employee.fullName}`);
      
      // Reload details to display account info inline
      await fetchEmployeeDetails();
      
      // Notify parent to refresh the main list
      if (onRefreshList) onRefreshList();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra khi cấp tài khoản');
    } finally {
      setGranting(false);
    }
  };

  if (!employee) return null;

  const tenPhongBan = employee.department?.name || 'Chưa có phòng ban';
  const hoVaTen = employee.fullName || 'Chưa có tên';
  const chucVu = employee.position?.name || 'Chưa có chức vụ';
  const chuyenMon = employee.expertise?.name || 'Chưa cập nhật';
  const email = employee.gmail || 'Chưa cập nhật';
  const soDienThoai = employee.phone || 'Chưa cập nhật';
  const avatarUrl = employee.imgPath;

  const isActiveVal = employee.isActive;
  const statusType = isActiveVal ? 'normal' : 'inactive';
  const statusLabel = isActiveVal ? 'Đang làm việc' : 'Nghỉ việc';

  const account = employee.account;

  return (
    <Modal show={true} onHide={onClose} centered size="lg" className="detail-employee-modal">
      <Modal.Header>
        <Modal.Title className="d-flex align-items-center gap-2">
          <BsPersonBadge className="text-primary" />
          Hồ sơ Nhân viên
        </Modal.Title>
        <button type="button" className="btn-close-custom" onClick={onClose}>
          <BsX />
        </button>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="employee-detail-card">
          <div className="employee-detail-header">
            <div className="employee-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={hoVaTen} />
              ) : (
                <div className="avatar-placeholder">
                  {hoVaTen ? hoVaTen.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="employee-title">
              <h3>{hoVaTen}</h3>
              <p>{chucVu} - {tenPhongBan}</p>
              <StatusBadge status={statusType} label={statusLabel} />
            </div>
          </div>

          <div className="employee-detail-body">
            <Row>
              <Col md={6}>
                <div className="info-group">
                  <div className="info-label"><BsEnvelope /> Email</div>
                  <div className="info-value">{email}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-group">
                  <div className="info-label"><BsTelephone /> Số điện thoại</div>
                  <div className="info-value">{soDienThoai}</div>
                </div>
              </Col>
            </Row>
            
            <hr className="my-4" />

            <div className="form-section-title mb-3">
              <BsBriefcase /> Công việc & Chuyên môn
            </div>
            <Row>
              <Col md={6}>
                <div className="info-group">
                  <div className="info-label">Chức vụ</div>
                  <div className="info-value">{chucVu}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-group">
                  <div className="info-label">Phòng ban</div>
                  <div className="info-value">{tenPhongBan}</div>
                </div>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <div className="info-group">
                  <div className="info-label">Chuyên môn</div>
                  <div className="info-value">{chuyenMon}</div>
                </div>
              </Col>
            </Row>

            <hr className="my-4" />

            <div className="form-section-title mb-3">
              <BsShieldLock /> Tài khoản đăng nhập
            </div>

            {loadingEmployee ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Đang tải thông tin tài khoản...</span>
              </div>
            ) : account ? (
              <Row>
                <Col md={6}>
                  <div className="info-group">
                    <div className="info-label">Tên đăng nhập</div>
                    <div className="info-value font-mono">{account.username}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-group">
                    <div className="info-label">Trạng thái tài khoản</div>
                    <div className="info-value">
                      <span className={account.status === 'ACTIVE' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                        {account.status === 'ACTIVE' ? 'Hoạt động' : 'Đang khoá'}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={12} className="mt-3">
                  <div className="info-group">
                    <div className="info-label">Vai trò</div>
                    <div className="info-value d-flex gap-2 flex-wrap mt-1">
                      {account.roles && account.roles.length > 0 ? (
                        account.roles.map(role => (
                          <span key={role.id} className="badge bg-secondary px-2.5 py-1.5 fs-7">
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">Chưa phân vai trò</span>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            ) : (
              <div className="p-3 border rounded bg-light">
                <p className="text-secondary mb-3">Nhân viên này chưa được cấp tài khoản hệ thống.</p>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Chọn vai trò cần cấp</Form.Label>
                  <Form.Select 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={granting}
                    style={{ maxWidth: '300px' }}
                  >
                    {roles.length === 0 && <option value="">Đang tải vai trò...</option>}
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button 
                  variant="success" 
                  onClick={handleGrantAccount}
                  disabled={granting || !selectedRole}
                  className="d-inline-flex align-items-center gap-2"
                >
                  {granting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      Đang cấp...
                    </>
                  ) : (
                    <>
                      <BsPlusCircle />
                      Cấp tài khoản
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
