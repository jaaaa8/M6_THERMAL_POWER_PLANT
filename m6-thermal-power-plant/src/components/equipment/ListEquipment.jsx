import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Modal, Table, Spinner, Badge } from 'react-bootstrap';
import {
  BsSearch, BsPlusLg, BsEye, BsPencil, BsTrash, BsX,
  BsGearWideConnected, BsFileEarmarkPdf, BsTag, BsPlus
} from 'react-icons/bs';
import * as equipmentService from "../../services/equipment/equipmentService";
import PageHeader from '../common/PageHeader';
import StatusBadge from '../common/StatusBadge';
import ConfirmModal from '../common/ConfirmModal';
import { toast } from 'react-toastify';
import './style/ListEquipment.css';
import PaginationPanel from "./PaginationPanel";

export default function ListEquipment() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search/Filters states
  const [searchKks, setSearchKks] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Active view states
  const [selectedEqId, setSelectedEqId] = useState(null); // When viewing detail
  const [selectedEqData, setSelectedEqData] = useState(null);


  // Modals state
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });
  const [deleting, setDeleting] = useState(false);

  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const fetchEquipmentTypes = async () => {

    try {

      const res = await equipmentService.getEquipmentTypes();

      setEquipmentTypes(res.data);

    } catch (err) {

      console.log(err);

    }

  }

  // Fetch equipments list
  const fetchEquipments = async (pageIdx = 0, currentSize = size) => {
    setLoading(true);

    try {
      const params = {
        page: pageIdx,
        size: currentSize
      };

      if (searchKks.trim()) {
        params.kks = searchKks.trim();
      }

      if (searchName.trim()) {
        params.name = searchName.trim();
      }

      if (filterType) {
        params.typeId = Number(filterType);
      }

      // Chỉ gửi status khi có chọn
      if (filterStatus) {
        params.status = filterStatus;
      }

      console.log(params);

      const res = await equipmentService.getAll(params);

      setData(res.data.content);
      setPage(res.data.number);
      setSize(res.data.size);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);

    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách thiết bị");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchEquipmentTypes();
    fetchEquipments(0);
  }, []);

  // Handle filter submission
  const handleApplyFilter = () => {
    fetchEquipments(0);
  };

  // Clear filters
  const handleClearFilter = () => {
    setSearchKks('');
    setSearchName('');
    setFilterType('');
    setFilterStatus('');
    // Trigger fetch after clearing state
    setTimeout(() => {
      fetchEquipments(0);
    }, 50);
  };

  // Handle pagination size change
  const handleSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setSize(newSize);
    fetchEquipments(0, newSize);
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await equipmentService.delete(deleteModal.data.id);
      toast.success('Xóa thiết bị thành công');
      setDeleteModal({ show: false, data: null });
      fetchEquipments(page);
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi xóa thiết bị');
    } finally {
      setDeleting(false);
    }
  };

  // View details handler
  const handleViewDetails = async (eq) => {
    try {
      const res = await equipmentService.getById(eq.id);
      setSelectedEqData(res.data);
      setSelectedEqId(eq.id);
      setDetailTab('tech-param');
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải thông tin chi tiết thiết bị');
    }
  };

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

      const res = await equipmentService.update(selectedEqId, updatedData);
      setSelectedEqData(res.data);
      setTechParamModalShow(false);
      toast.success('Cập nhật thông số kỹ thuật thành công!');
      // Update data list to refresh
      fetchEquipments(page);
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi lưu thông số kỹ thuật');
    }
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
  const getEquipmentImage = (equipment) => {

    if (equipment.imageUrl) {
      return equipment.imageUrl;
    }

    return "/images/no-image.png";

  };

  return (
    <div className="list-equipment-container animate-fade-in">
      <PageHeader
        title="Danh sách Thiết bị"
        subtitle="Quản lý và cập nhật thông số kỹ thuật thiết bị trong các hệ thống"
        actions={
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => navigate("/equipment/equipments/units")}
              className="d-inline-flex align-items-center gap-2 px-3"
            >
              <BsTag />
              Quản lý đơn vị
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/equipment/equipments/add')}
              className="d-inline-flex align-items-center gap-2 px-3"
            >
              <BsPlusLg />
              Thêm thiết bị
            </Button>
          </div>
        }
      />

      {/* Filter / Search Bar */}
      <div className="search-filter-card p-4">
        <Row className="g-3 align-items-end">
          <Col md={3} sm={12}>
            <Form.Group>
              <Form.Label htmlFor="searchKks">Mã KKS</Form.Label>
              <Form.Control
                id="searchKks"
                type="text"
                placeholder="Nhập mã KKS..."
                value={searchKks}
                onChange={(e) => setSearchKks(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </Form.Group>
          </Col>
          <Col md={3} sm={12}>
            <Form.Group>
              <Form.Label htmlFor="searchName">Tên thiết bị</Form.Label>
              <Form.Control
                id="searchName"
                type="text"
                placeholder="Nhập tên thiết bị..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </Form.Group>
          </Col>
          <Col md={2} sm={6}>
            <Form.Group>
              <Form.Label htmlFor="filterType">Loại thiết bị</Form.Label>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >

                <option value="">Tất cả</option>

                {
                  equipmentTypes.map(type => (
                    <option
                      key={type.id}
                      value={type.id}
                    >
                      {type.name}
                    </option>
                  ))
                }

              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2} sm={6}>
            <Form.Group>
              <Form.Label htmlFor="filterStatus">Trạng thái</Form.Label>
              <Form.Select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="MAINTENANCE">Bảo dưỡng</option>
                <option value="FAILURE">Sự cố</option>
                <option value="STANDBY">Dự phòng</option>
                <option value="RETIRED">Thanh lý</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2} sm={12} className="d-flex gap-2">
            <Button
              variant="primary"
              className="flex-fill d-inline-flex align-items-center justify-content-center gap-2"
              onClick={handleApplyFilter}
            >
              <BsSearch />
              Tìm kiếm
            </Button>
            <Button
              variant="light"
              onClick={handleClearFilter}
              title="Đặt lại bộ lọc"
            >
              <BsX size={20} />
            </Button>
          </Col>
        </Row>
      </div>

      {/* Equipment Table List */}
      <div className="surface-card p-0 overflow-hidden border rounded-lg">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" className="mb-2" />
            <div className="text-secondary">Đang tải danh sách thiết bị...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-5 text-muted bg-light">
            Không tìm thấy thiết bị nào khớp với bộ lọc tìm kiếm.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover align="middle" className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: 50 }} className="text-center">#</th>
                  <th style={{ width: 80 }} className="text-center">Hình ảnh</th>
                  <th style={{ width: 140 }}>Mã KKS</th>
                  <th>Tên thiết bị</th>
                  <th style={{ width: 140 }}>Loại thiết bị</th>
                  <th style={{ width: 130 }}>Trạng thái</th>
                  <th style={{ width: 120 }} className="text-end px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  const statusProps = getStatusProps(row.status);
                  return (
                    <tr key={row.id}>
                      <td className="text-center">
                        {(page * size) + idx + 1}
                      </td>
                      <td className="text-center">
                        <img
                          className="equipment-table-img"
                          src={getEquipmentImage(row)}
                          alt={row.name}
                        />
                      </td>
                      <td>{row.kksCode}</td>
                      <td>
                        <div className="fw-semibold">
                          {row.name}
                        </div>
                      </td>
                      <td>
                        {row.equipmentType}
                      </td>
                      <td>
                        <StatusBadge
                          status={statusProps.status}
                          label={statusProps.label}
                        />
                      </td>
                      <td className="text-end px-4">
                        <div className="d-flex align-items-center gap-2 justify-content-end">
                          <button
                            className="equipment-action-btn view-btn"
                            title="Xem chi tiết"
                            onClick={() => handleViewDetails(row)}
                          >
                            <BsEye size={16} />
                          </button>
                          <button
                            className="equipment-action-btn edit-btn"
                            title="Chỉnh sửa"
                            onClick={() => navigate(`/equipment/equipments/edit/${row.id}`)}
                          >
                            <BsPencil size={14} />
                          </button>
                          <button
                            className="equipment-action-btn delete-btn"
                            title="Xóa"
                            onClick={() => setDeleteModal({ show: true, data: row })}
                          >
                            <BsTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}

        <PaginationPanel
          page={page}
          size={size}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={(newPage) => fetchEquipments(newPage)}
          onSizeChange={(newSize) => {
            setSize(newSize);
            fetchEquipments(0, newSize);
          }}
        />

        {/* Modal: Xác nhận xóa */}
        <ConfirmModal
          show={deleteModal.show}
          onClose={() => setDeleteModal({ show: false, data: null })}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
          title="Xóa thiết bị"
          confirmText="Xóa"
          cancelText="Hủy"
          variant="danger"
          message={
            deleteModal.data ? (
              <div>
                <p className="mb-2">Bạn có chắc chắn muốn xóa thiết bị sau?</p>
                <div className="p-3 bg-light rounded border mb-2 text-start">
                  <strong>KKS:</strong> {deleteModal.data.kksCode}<br />
                  <strong>Tên thiết bị:</strong> {deleteModal.data.name}
                </div>
                <p className="text-danger small mb-0">Thiết bị sẽ được chuyển vào thùng rác.</p>
              </div>
            ) : ''
          }
        />
      </div>
    </div>
  );

}
