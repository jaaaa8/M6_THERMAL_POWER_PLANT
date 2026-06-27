import { Modal, Button, Row, Col } from 'react-bootstrap';
import { BsX, BsPersonBadge, BsBriefcase, BsEnvelope, BsTelephone, BsCheckCircle } from 'react-icons/bs';
import StatusBadge from '../../common/StatusBadge';
import './style/DetailEmployee.css';

export default function DetailEmployee({ data, phongBanList, onClose }) {
  if (!data) return null;

  const pb = phongBanList.find(p => String(p.id) === String(data.maPhongBan));
  const tenPhongBan = pb ? pb.tenPhongBan : 'Chưa có phòng ban';

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
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt={data.hoVaTen} />
              ) : (
                <div className="avatar-placeholder">
                  {data.hoVaTen ? data.hoVaTen.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="employee-title">
              <h3>{data.hoVaTen}</h3>
              <p>{data.chucVu} - {tenPhongBan}</p>
              <StatusBadge status={data.trangThai} />
            </div>
          </div>

          <div className="employee-detail-body">
            <Row>
              <Col md={6}>
                <div className="info-group">
                  <div className="info-label"><BsEnvelope /> Email</div>
                  <div className="info-value">{data.email || 'Chưa cập nhật'}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-group">
                  <div className="info-label"><BsTelephone /> Số điện thoại</div>
                  <div className="info-value">{data.soDienThoai || 'Chưa cập nhật'}</div>
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
                  <div className="info-value">{data.chucVu}</div>
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
                  <div className="info-value">{data.chuyenMon || 'Chưa cập nhật'}</div>
                </div>
              </Col>
            </Row>
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
