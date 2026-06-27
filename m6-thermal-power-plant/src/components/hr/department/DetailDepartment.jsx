import { Modal, Button } from 'react-bootstrap';
import { BsX, BsBuilding } from 'react-icons/bs';
import StatusBadge from '../../common/StatusBadge';
import './style/DetailDepartment.css';

export default function DetailDepartment({ data, onClose }) {
  if (!data) return null;

  return (
    <Modal 
      show={true} 
      onHide={onClose}
      size="md"
      centered
      className="detail-department-modal"
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
          <div className="department-avatar mx-auto mb-3">
            <BsBuilding size={48} className="text-primary" />
          </div>
          <h4 className="mb-1">{data.tenPhongBan}</h4>
          <div className="mt-2">
            <StatusBadge 
              status={data.trangThai === 'NGUNG_HOAT_DONG' ? 'NGHI_VIEC' : 'DANG_LAM_VIEC'} 
              customLabel={data.trangThai === 'NGUNG_HOAT_DONG' ? 'Ngừng hoạt động' : 'Hoạt động'}
            />
          </div>
        </div>

        <div className="detail-section">
          <h6 className="section-title">Thông tin chi tiết</h6>
          <div className="info-grid">
            <div className="info-item full-width">
              <span className="info-label">Mã phòng ban</span>
              <span className="info-value">PB-{String(data.id).padStart(3, '0')}</span>
            </div>
            
            <div className="info-item full-width mt-3">
              <span className="info-label">Mô tả nhiệm vụ</span>
              <div className="info-value description-box">
                {data.moTa || 'Chưa có thông tin mô tả cho phòng ban này.'}
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
