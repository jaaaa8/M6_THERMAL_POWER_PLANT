import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Table, Spinner, Badge } from 'react-bootstrap';
import { BsFileEarmarkPdf, BsArrowLeft } from 'react-icons/bs';
import * as equipmentService from "../../services/equipment/equipmentService";
import PageHeader from '../common/PageHeader';
import StatusBadge from '../common/StatusBadge';
import { toast } from 'react-toastify';
import './style/ListEquipment.css';
import './style/DetailEquipment.css';
import TechnicalParameterTab from "./TechnicalParameterTab";
import RepairHistoryTab from "../repair_history/RepairHistoryList";
import LubricationHistoryTab from "./LubricationHistoryTab";
import * as parameterService from "../../services/equipment/parameterService";
export default function DetailEquipment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [selectedEqData, setSelectedEqData] = useState(null);

  const [detailTab, setDetailTab] = useState('general'); // 'general', 'tech-param', 'repair-history', 'maintenance-history', 'lubrication-history'

  const [currentImage, setCurrentImage] = useState(0);


  // Fetch equipment detail
  const fetchEquipmentDetail = async () => {
    setLoading(true);

    try {
      const { data } = await equipmentService.getById(id);

      const parameterRes = await parameterService.getByEquipment(id);

      setSelectedEqData({
        ...data,
        equipmentName: data.name,
        equipmentType: data.equipmentTypeName,
        installYear: data.installationYear,
        technicalParameters: parameterRes.data
      });

      setCurrentImage(0);

    } catch (e) {
      console.error(e);
      toast.error("Không thể tải thông tin chi tiết thiết bị");
      navigate("/equipment/equipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEquipmentDetail();
    }
  }, [id]);

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
              onClick={() => navigate(`/equipment/equipments/system/${selectedEqData.systemId}`)}
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
            <div className="d-flex align-items-center justify-content-center gap-2">

              {selectedEqData.imageUrls?.length > 1 && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={() =>
                    setCurrentImage(prev =>
                      prev === 0
                        ? selectedEqData.imageUrls.length - 1
                        : prev - 1
                    )
                  }
                >
                  ❮
                </Button>
              )}

              <div className="detail-img-box">
                <img
                  src={
                    selectedEqData.imageUrls?.length
                      ? selectedEqData.imageUrls[currentImage]
                      : getEquipmentImage(selectedEqData)
                  }
                  alt={selectedEqData.name}
                />
              </div>

              {selectedEqData.imageUrls?.length > 1 && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={() =>
                    setCurrentImage(prev =>
                      prev === selectedEqData.imageUrls.length - 1
                        ? 0
                        : prev + 1
                    )
                  }
                >
                  ❯
                </Button>
              )}

            </div>
          </div>
          <h5 className="fw-bold mb-1 mt-2 text-center">{selectedEqData.name}</h5>
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
              <span className="detail-info-label">Trạng thái</span>
              <span className="detail-info-value">
                <StatusBadge status={statusProps.status} label={statusProps.label} />
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
              onClick={() =>
                setDetailTab("lubrication-history")
              }
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

            {detailTab === "tech-param" && (
              <TechnicalParameterTab
                equipmentId={id}
                technicalParameters={selectedEqData.technicalParameters}
                onReload={fetchEquipmentDetail}
              />
            )}
            {detailTab === "repair-history" && (

              <RepairHistoryTab
                equipmentId={id}
              />

            )}


            {
              detailTab === "lubrication-history" && (

                <LubricationHistoryTab
                  equipmentId={id}
                />

              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}
