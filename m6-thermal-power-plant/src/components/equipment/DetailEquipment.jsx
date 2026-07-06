import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Modal, Table, Spinner, Badge } from 'react-bootstrap';
import {
  BsPlusLg, BsPencil, BsTrash, BsPlus, BsFileEarmarkPdf, BsArrowLeft
} from 'react-icons/bs';
import * as equipmentService from "../../services/equipmentService";
import PageHeader from '../common/PageHeader';
import StatusBadge from '../common/StatusBadge';
import { toast } from 'react-toastify';
import './style/ListEquipment.css';

export default function DetailEquipment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [selectedEqData, setSelectedEqData] = useState(null);
  const [systems, setSystems] = useState([]);
  const [detailTab, setDetailTab] = useState('tech-param'); // 'general', 'tech-param', 'repair-history', 'maintenance-history'
  const [techParamModalShow, setTechParamModalShow] = useState(false);
  const [unitsList, setUnitsList] = useState([]);
  const [tempParams, setTempParams] = useState([]);

  // Fetch systems to map names and fill dropdowns
  const fetchSystems = async () => {
    try {
      const res = await systemService.getAll('', '', 0, 1000);
      setSystems(res.data?.content || []);
    } catch (e) {
      console.error('Lỗi tải hệ thống:', e);
    }
  };

  // Fetch units list
  const fetchUnits = async () => {
    try {
      const u = await equipmentService.getUnits();
      setUnitsList(u);
    } catch (e) {
      console.error('Lỗi tải đơn vị:', e);
    }
  };

  // Fetch equipment detail
  const fetchEquipmentDetail = async () => {
    setLoading(true);
    try {
      const res = await equipmentService.getById(id);
      setSelectedEqData(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải thông tin chi tiết thiết bị');
      navigate('/equipment/equipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
    fetchUnits();
    if (id) {
      fetchEquipmentDetail();
    }
  }, [id]);

  // Open parameter edit modal
  const handleOpenTechParamModal = () => {
    const params = selectedEqData?.technicalParameters || [];
    // Deep clone parameters
    setTempParams(params.map((p, idx) => ({ ...p, tempId: idx + 1 })));
    setTechParamModalShow(true);
  };

  // Add technical parameter row in modal
  const handleAddParamRow = () => {
    const nextId = tempParams.length > 0 ? Math.max(...tempParams.map(p => p.tempId || 0)) + 1 : 1;
    setTempParams([
      ...tempParams,
      { tempId: nextId, name: '', value: '', unit: unitsList[0] || '' }
    ]);
  };

  // Edit technical parameter field inside row
  const handleEditParamRowField = (tempId, field, value) => {
    setTempParams(prev => prev.map(p => {
      if (p.tempId === tempId) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // Delete technical parameter row in modal
  const handleDeleteParamRow = (tempId) => {
    setTempParams(prev => prev.filter(p => p.tempId !== tempId));
  };

  // Save technical parameters
  const handleSaveTechParams = async () => {
    // Validate rows
    const hasEmpty = tempParams.some(p => !p.name.trim() || !p.value.trim());
    if (hasEmpty) {
      toast.warning('Vui lòng điền đầy đủ Tên thông số và Giá trị');
      return;
    }

    try {
      // Map back to standard parameters (removing tempId)
      const cleanParams = tempParams.map((p, idx) => ({
        id: p.id || idx + 1,
        name: p.name.trim(),
        value: p.value.trim(),
        unit: p.unit
      }));

      const updatedData = {
        ...selectedEqData,
        technicalParameters: cleanParams
      };

      const res = await equipmentService.update(id, updatedData);
      setSelectedEqData(res.data);
      setTechParamModalShow(false);
      toast.success('Cập nhật thông số kỹ thuật thành công!');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi lưu thông số kỹ thuật');
    }
  };

  // PDF Export placeholder
  const handleExportPdf = () => {
    toast.info('Tính năng xuất PDF đang được xử lý...');
  };

  // Helper resolving system name from systems list
  const getSystemName = (sysId) => {
    const sys = systems.find(s => s.id === Number(sysId));
    return sys ? sys.name : 'Chưa phân loại';
  };

  // Status mapping
  const getStatusProps = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { status: 'normal', label: 'Hoạt động' };
      case 'MAINTENANCE':
        return { status: 'warning', label: 'Bảo dưỡng' };
      case 'FAILURE':
        return { status: 'danger', label: 'Sự cố' };
      case 'STANDBY':
        return { status: 'secondary', label: 'Dự phòng' };
      case 'RETIRED':
        return { status: 'inactive', label: 'Thanh lý' };
      default:
        return { status: 'secondary', label: status || 'Không rõ' };
    }
  };

  // Default fallback image
  const getEquipmentImage = (eq) => {
    if (eq.imageUrl && eq.imageUrl.trim() !== "") {
      return eq.imageUrl;
    }
    // Generate clean SVG base64 icon depending on type
    const color = '#2563eb';
    let iconSvg = '';
    if (eq.equipmentType === 'Bơm') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M16.24 7.76l-2.12 2.12M9.88 14.12l-2.12 2.12"/></svg>`;
    } else if (eq.equipmentType === 'Van') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20M5 17V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10M9 9h6M9 13h6"/></svg>`;
    } else if (eq.equipmentType === 'Động cơ') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h6"/></svg>`;
    } else {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(iconSvg)}`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" className="mb-2" />
        <div className="text-secondary">Đang tải thông tin chi tiết thiết bị...</div>
      </div>
    );
  }

  if (!selectedEqData) {
    return (
      <div className="text-center py-5 text-muted bg-light rounded border">
        Không tìm thấy thông tin thiết bị.
      </div>
    );
  }

  const statusProps = getStatusProps(selectedEqData.status);

  return (
    <div className="equipment-detail-container animate-fade-in">
      <PageHeader
        title="Chi tiết thiết bị"
        subtitle={`Quản lý và cập nhật thông số kỹ thuật cho thiết bị ${selectedEqData.equipmentName}`}
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Hệ thống & Thiết bị', path: '/equipment/system' },
          { label: 'Thiết bị', path: '/equipment/equipments' },
          { label: 'Chi tiết thiết bị' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={handleExportPdf} className="d-inline-flex align-items-center gap-2">
              <BsFileEarmarkPdf />
              Xuất PDF
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/equipment/equipments')}
              className="d-inline-flex align-items-center gap-2"
            >
              <BsArrowLeft />
              Quay lại
            </Button>
          </div>
        }
      />

      <div className="detail-layout">
        {/* Left Pane */}
        <div className="general-info-card bg-white">
          <div className="detail-img-box">
            <img src={getEquipmentImage(selectedEqData)} alt={selectedEqData.equipmentName} />
          </div>
          <h5 className="fw-bold mb-1 mt-2 text-center">{selectedEqData.equipmentName}</h5>
          <Badge bg="light" className="text-secondary mb-2">{selectedEqData.kksCode}</Badge>

          <div className="detail-info-list">
            <div className="detail-info-item">
              <span className="detail-info-label">Mã KKS</span>
              <span className="detail-info-value font-mono">{selectedEqData.kksCode}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Tên thiết bị</span>
              <span className="detail-info-value">{selectedEqData.equipmentName}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Hệ thống</span>
              <span className="detail-info-value">{selectedEqData.systemName || getSystemName(selectedEqData.systemId)}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Loại thiết bị</span>
              <span className="detail-info-value">{selectedEqData.equipmentType}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Trạng thái</span>
              <span className="detail-info-value">
                <StatusBadge status={statusProps.status} label={statusProps.label} />
              </span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Nhà sản xuất</span>
              <span className="detail-info-value">{selectedEqData.manufacturer || 'Grundfos'}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Model</span>
              <span className="detail-info-value">{selectedEqData.model || 'CR 64-4'}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Năm lắp đặt</span>
              <span className="detail-info-value">{selectedEqData.installYear}</span>
            </div>
            <div className="detail-info-item flex-column align-items-start gap-1">
              <span className="detail-info-label">Mô tả</span>
              <span className="detail-info-value text-start w-100 fw-normal text-muted">
                {selectedEqData.description || 'Chưa có mô tả chi tiết cho thiết bị này.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Pane */}
        <div className="detail-content-card bg-white">
          <div className="detail-tabs-header">
            <button
              className={`detail-tab-btn ${detailTab === 'general' ? 'active' : ''}`}
              onClick={() => setDetailTab('general')}
            >
              Thông tin chung
            </button>
            <button
              className={`detail-tab-btn ${detailTab === 'tech-param' ? 'active' : ''}`}
              onClick={() => setDetailTab('tech-param')}
            >
              Thông số kỹ thuật
            </button>
            <button
              className={`detail-tab-btn ${detailTab === 'repair-history' ? 'active' : ''}`}
              onClick={() => setDetailTab('repair-history')}
            >
              Lịch sử sửa chữa
            </button>
            <button
              className={`detail-tab-btn ${detailTab === 'maintenance-history' ? 'active' : ''}`}
              onClick={() => setDetailTab('maintenance-history')}
            >
              Lịch sử bảo dưỡng
            </button>
          </div>

          <div className="detail-tab-content">
            {detailTab === 'general' && (
              <div>
                <h5 className="fw-bold mb-4">Thông tin chi tiết thiết bị</h5>
                <Table bordered hover>
                  <tbody>
                    <tr>
                      <td className="bg-light fw-bold" style={{ width: '30%' }}>Mã KKS</td>
                      <td>{selectedEqData.kksCode}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Tên thiết bị</td>
                      <td>{selectedEqData.equipmentName}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Loại thiết bị</td>
                      <td>{selectedEqData.equipmentType}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Hệ thống</td>
                      <td>{selectedEqData.systemName || getSystemName(selectedEqData.systemId)}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Model</td>
                      <td>{selectedEqData.model}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Nhà sản xuất</td>
                      <td>{selectedEqData.manufacturer || 'Chưa cập nhật'}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Năm hoạt động</td>
                      <td>{selectedEqData.installYear}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Mô tả</td>
                      <td>{selectedEqData.description}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            )}

            {detailTab === 'tech-param' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Thông số kỹ thuật của thiết bị</h5>
                  <Button
                    variant="primary"
                    onClick={handleOpenTechParamModal}
                    className="d-inline-flex align-items-center gap-2"
                  >
                    <BsPlusLg size={12} />
                    Thêm thông số
                  </Button>
                </div>

                {(!selectedEqData.technicalParameters || selectedEqData.technicalParameters.length === 0) ? (
                  <div className="text-center py-5 text-muted bg-light rounded border">
                    Chưa có thông số kỹ thuật. Nhấp "Thêm thông số" để cập nhật.
                  </div>
                ) : (
                  <div className="table-responsive rounded border">
                    <Table hover className="tech-param-table mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>#</th>
                          <th>Tên thông số</th>
                          <th>Giá trị</th>
                          <th style={{ width: 120 }}>Đơn vị</th>
                          <th style={{ width: 100 }} className="text-end">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEqData.technicalParameters.map((p, idx) => (
                          <tr key={p.id || idx}>
                            <td>{idx + 1}</td>
                            <td className="fw-semibold">{p.name}</td>
                            <td className="font-mono text-primary fw-bold">{p.value}</td>
                            <td>
                              <Badge bg="light" className="text-dark border px-2 py-1">{p.unit}</Badge>
                            </td>
                            <td className="text-end">
                              <Button
                                variant="link"
                                className="p-0 text-primary me-2"
                                onClick={handleOpenTechParamModal}
                                title="Chỉnh sửa thông số"
                              >
                                <BsPencil size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'repair-history' && (
              <div className="text-center py-5 text-muted bg-light rounded border">
                🚧 Không tìm thấy lịch sử sửa chữa nào của thiết bị này.
              </div>
            )}

            {detailTab === 'maintenance-history' && (
              <div className="text-center py-5 text-muted bg-light rounded border">
                🚧 Không có lịch sử bảo dưỡng định kỳ gần đây cho thiết bị này.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Thêm thông số kỹ thuật (Chỉnh sửa bảng hàng loạt) */}
      <Modal
        show={techParamModalShow}
        onHide={() => setTechParamModalShow(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Thêm thông số kỹ thuật</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <Table bordered hover align="middle">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Tên thông số *</th>
                  <th style={{ width: 220 }}>Giá trị *</th>
                  <th style={{ width: 180 }}>Đơn vị</th>
                  <th style={{ width: 60 }} className="text-center">Xóa</th>
                </tr>
              </thead>
              <tbody>
                {tempParams.map((p, idx) => (
                  <tr key={p.tempId}>
                    <td className="text-center fw-bold">{idx + 1}</td>
                    <td>
                      <Form.Control
                        type="text"
                        placeholder="Nhập tên thông số (ví dụ: Áp suất)..."
                        value={p.name}
                        onChange={(e) => handleEditParamRowField(p.tempId, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        placeholder="Nhập giá trị..."
                        value={p.value}
                        onChange={(e) => handleEditParamRowField(p.tempId, 'value', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Select
                        value={p.unit}
                        onChange={(e) => handleEditParamRowField(p.tempId, 'unit', e.target.value)}
                      >
                        {unitsList.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="link"
                        className="p-0 text-danger"
                        onClick={() => handleDeleteParamRow(p.tempId)}
                      >
                        <BsTrash size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <Button
            variant="outline-secondary"
            onClick={handleAddParamRow}
            className="mt-2 d-inline-flex align-items-center gap-1"
          >
            <BsPlus />
            Thêm dòng
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setTechParamModalShow(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveTechParams}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
