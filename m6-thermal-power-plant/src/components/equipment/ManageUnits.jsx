import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { BsPlusLg, BsX, BsArrowLeft } from 'react-icons/bs';
import * as equipmentService from "../../services/equipmentService";
import PageHeader from '../common/PageHeader';
import { toast } from 'react-toastify';
import './style/ListEquipment.css';

export default function ManageUnits() {
  const navigate = useNavigate();
  const [unitsList, setUnitsList] = useState([]);
  const [newUnitInput, setNewUnitInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch units list
  const fetchUnits = async () => {
    setLoading(true);
    try {
      const u = await equipmentService.getUnits();
      setUnitsList(u);
    } catch (e) {
      console.error('Lỗi tải đơn vị:', e);
      toast.error('Không thể tải danh sách đơn vị đo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Add unit handler
  const handleAddUnit = async () => {
    if (!newUnitInput.trim()) return;
    try {
      const updated = await equipmentService.addUnit(newUnitInput.trim());
      setUnitsList(updated);
      setNewUnitInput('');
      toast.success('Thêm đơn vị thành công');
    } catch (e) {
      toast.error('Lỗi thêm đơn vị');
    }
  };

  // Delete unit handler
  const handleDeleteUnit = async (unit) => {
    try {
      const updated = await equipmentService.deleteUnit(unit);
      if (updated === true) {
        setUnitsList(prev => prev.filter(u => u !== unit));
      } else {
        setUnitsList(updated);
      }
      toast.success('Xóa đơn vị thành công');
    } catch (e) {
      toast.error('Lỗi xóa đơn vị');
    }
  };

  return (
    <div className="manage-units-container animate-fade-in">
      <PageHeader
        title="Quản lý Đơn vị đo lường"
        subtitle="Quản lý các đơn vị đo lường được sử dụng trong thông số kỹ thuật của thiết bị"
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Hệ thống & Thiết bị', path: '/equipment/system' },
          { label: 'Thiết bị', path: '/equipment/equipments' },
          { label: 'Quản lý đơn vị' }
        ]}
        actions={
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/equipment/equipments')}
            className="d-inline-flex align-items-center gap-2"
          >
            <BsArrowLeft />
            Quay lại danh sách
          </Button>
        }
      />

      <Row className="justify-content-center mt-4">
        <Col lg={8} md={10} sm={12}>
          <div className="search-filter-card p-4 mb-4">
            <h5 className="fw-bold mb-3">Thêm đơn vị mới</h5>
            <Form.Group>
              <Form.Label htmlFor="newUnitInput" className="fw-semibold">Tên đơn vị</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  id="newUnitInput"
                  type="text"
                  placeholder="Ví dụ: m3/h, bar, kW, v.v..."
                  value={newUnitInput}
                  onChange={(e) => setNewUnitInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
                />
                <Button
                  variant="primary"
                  onClick={handleAddUnit}
                  className="d-inline-flex align-items-center gap-2 px-4"
                  disabled={!newUnitInput.trim()}
                >
                  <BsPlusLg />
                  Thêm
                </Button>
              </div>
            </Form.Group>
          </div>

          <div className="surface-card p-4 border rounded-lg bg-white">
            <h5 className="fw-bold mb-3">Đơn vị đang sử dụng</h5>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-2" />
                <div className="text-secondary">Đang tải danh sách đơn vị...</div>
              </div>
            ) : unitsList.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded border">
                Chưa có đơn vị đo lường nào.
              </div>
            ) : (
              <div className="unit-badge-list p-3 bg-light rounded border">
                {unitsList.map(u => (
                  <span key={u} className="unit-tag">
                    {u}
                    <button
                      className="unit-tag-delete"
                      onClick={() => handleDeleteUnit(u)}
                      title={`Xóa đơn vị ${u}`}
                    >
                      <BsX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
