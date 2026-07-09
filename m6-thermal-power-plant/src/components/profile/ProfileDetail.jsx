import { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Row, Col } from 'react-bootstrap';
import { BsX, BsShieldLock, BsKey } from 'react-icons/bs';
import { authService } from '../../services/authService';
import { accountService } from '../../services/hr/accountService';
import { employeeService } from '../../services/hr/employeeService';
import { toast } from 'react-toastify';
import StatusBadge from '../common/StatusBadge';
import './ProfileDetail.css';

export default function ProfileDetail({ show, onClose, onChangePasswordClick }) {
  const [account, setAccount] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();
  const accountId = currentUser?.accountId;

  useEffect(() => {
    if (!show || !accountId) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const accRes = await accountService.getById(accountId);
        const accountData = accRes.data?.data || accRes.data || null;
        setAccount(accountData);
        
        if (accountData?.employee?.id) {
          const empRes = await employeeService.getById(accountData.employee.id);
          setEmployee(empRes.data?.data || empRes.data || null);
        }
      } catch (err) {
        toast.error('Không tải được thông tin cá nhân.');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [accountId, show]);

  if (!show) return null;

  return (
    <Modal 
      show={show} 
      onHide={onClose}
      size="lg"
      centered
      className="profile-detail-modal"
    >
      <Modal.Header className="border-0 pb-0">
        <h5 className="modal-title ms-3 mt-2 text-primary fw-bold">Thông tin cá nhân</h5>
        <Button 
          variant="light" 
          className="btn-close-custom ms-auto" 
          onClick={onClose}
        >
          <BsX size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2 fs-7">Đang tải thông tin cá nhân...</p>
          </div>
        ) : account ? (
          <Row>
            {/* Left Column: Account Info */}
            <Col md={5} className="border-end border-light">
              <div className="text-center mb-4">
                <div className="account-avatar mx-auto mb-3">
                  {account.image ? (
                    <img 
                      src={account.image.startsWith('http') ? account.image : `${import.meta.env.VITE_API_BASE_URL || ''}${account.image}`} 
                      alt={account.username} 
                      className="w-100 h-100 rounded-circle object-fit-cover"
                    />
                  ) : (
                    <BsShieldLock size={48} className="text-primary" />
                  )}
                </div>
                <h4 className="mb-1">{account.username}</h4>
                <p className="text-muted mb-2">Tên đăng nhập</p>
                <div className="mt-2">
                  <StatusBadge 
                    status={account.status === 'LOCKED' || account.status === 'KHOA' ? 'inactive' : 'normal'} 
                    label={account.status === 'LOCKED' || account.status === 'KHOA' ? 'Đã khóa' : 'Hoạt động'}
                  />
                </div>
              </div>

              <div className="detail-section">
                <h6 className="section-title">Bảo mật tài khoản</h6>
                <div className="info-grid">
                  <div className="info-item mb-3">
                    <span className="info-label">Email tài khoản</span>
                    <span className="info-value">{account.email || 'Chưa thiết lập'}</span>
                  </div>
                  
                  <div className="info-item mb-3">
                    <span className="info-label">Vai trò hệ thống</span>
                    {account.roles && account.roles.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1 mt-1.5">
                        {account.roles.map(r => (
                          <span key={r.id} className="badge bg-primary-100 text-primary px-2.5 py-1.5 rounded fs-7 fw-bold border border-primary-200">
                            {r.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="info-value text-muted">Chưa phân quyền</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-grid gap-2 px-2 mt-4">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center justify-content-center gap-2 py-2"
                  onClick={() => {
                    onClose();
                    onChangePasswordClick();
                  }}
                >
                  <BsKey size={18} /> Đổi mật khẩu
                </Button>
              </div>
            </Col>

            {/* Right Column: Employee Info */}
            <Col md={7}>
              <h5 className="mb-3 px-2 text-primary d-flex align-items-center gap-2">
                <span className="border-start border-primary border-3 ps-2">Thông tin nhân viên</span>
              </h5>
              
              {employee ? (
                <div className="detail-section h-100">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="info-item">
                        <span className="info-label">Mã nhân viên</span>
                        <span className="info-value text-dark">{employee.employeeCode || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-item">
                        <span className="info-label">Họ và tên</span>
                        <span className="info-value text-dark">{employee.fullName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-item">
                        <span className="info-label">Số điện thoại</span>
                        <span className="info-value text-dark">{employee.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-item">
                        <span className="info-label">Gmail cá nhân</span>
                        <span className="info-value text-dark">{employee.gmail || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-item">
                        <span className="info-label">Phòng ban</span>
                        <span className="info-value text-dark">{employee.department?.name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-item">
                        <span className="info-label">Chức vụ</span>
                        <span className="info-value text-dark">{employee.position?.name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-item">
                        <span className="info-label">Trình độ chuyên môn</span>
                        <span className="info-value text-dark">{employee.expertise?.name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-item">
                        <span className="info-label">Trạng thái làm việc</span>
                        <div className="mt-1">
                          <StatusBadge 
                            status={employee.isActive ? 'normal' : 'inactive'} 
                            label={employee.isActive ? 'Đang làm việc' : 'Nghỉ việc'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detail-section d-flex align-items-center justify-content-center h-100 text-center py-5">
                  <div>
                    <p className="text-muted mb-0">Tài khoản hệ thống admin/quản trị viên,</p>
                    <p className="text-muted">chưa liên kết với hồ sơ nhân viên.</p>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        ) : (
          <div className="text-center py-4">
            <p className="text-danger">Không tìm thấy thông tin tài khoản.</p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
