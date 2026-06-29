import { Modal, Button } from 'react-bootstrap';
import { BsX, BsShieldLock } from 'react-icons/bs';
import StatusBadge from '../../common/StatusBadge';
import './style/DetailAccount.css';

export default function DetailAccount({ data, mapVaiTro, onClose }) {
  if (!data) return null;

  return (
    <Modal 
      show={true} 
      onHide={onClose}
      size="md"
      centered
      className="detail-account-modal"
    >
      <Modal.Header className="border-0 pb-0">
        <Button 
          variant="light" 
          className="btn-close-custom ms-auto" 
          onClick={onClose}
        >
          <BsX size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        <div className="text-center mb-4">
          <div className="account-avatar mx-auto mb-3">
            <BsShieldLock size={48} className="text-primary" />
          </div>
          <h4 className="mb-1">{data.hoVaTen}</h4>
          <p className="text-muted mb-2">@{data.tenDangNhap}</p>
          <div className="mt-2">
            <StatusBadge 
              status={data.trangThai === 'KHOA' ? 'NGHI_VIEC' : 'DANG_LAM_VIEC'} 
              customLabel={data.trangThai === 'KHOA' ? 'Đã khóa' : 'Hoạt động'}
            />
          </div>
        </div>

        <div className="detail-section">
          <h6 className="section-title">Thông tin bảo mật</h6>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Email liên hệ</span>
              <span className="info-value">{data.email || 'Chưa cập nhật'}</span>
            </div>
            
            <div className="info-item mt-3">
              <span className="info-label">Vai trò hệ thống</span>
              <span className="info-value text-primary font-weight-bold">
                {mapVaiTro[data.vaiTro] || data.vaiTro}
              </span>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
