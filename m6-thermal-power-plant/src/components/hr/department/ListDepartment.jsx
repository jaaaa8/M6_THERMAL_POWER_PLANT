import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsBuildingAdd, BsFilter } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { phongBanService } from '../../../services/phongBanService';
import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';
import StatusBadge from '../../common/StatusBadge';
import DetailDepartment from './DetailDepartment';
import DeleteDepartment from './DeleteDepartment';
import './style/ListDepartment.css';

const MOCK_PHONG_BAN = [
  { id: 1, tenPhongBan: 'Phòng Kỹ thuật', moTa: 'Quản lý, vận hành và bảo trì máy móc', trangThai: 'HOAT_DONG' },
  { id: 2, tenPhongBan: 'Phòng Hành chính Nhân sự', moTa: 'Tuyển dụng, chấm công và quản trị nhân sự', trangThai: 'HOAT_DONG' },
  { id: 3, tenPhongBan: 'Phòng Kế toán', moTa: 'Xử lý các nghiệp vụ tài chính, kế toán', trangThai: 'HOAT_DONG' },
  { id: 4, tenPhongBan: 'Phòng Vật tư', moTa: 'Quản lý kho bãi và thiết bị vật tư', trangThai: 'NGUNG_HOAT_DONG' },
];

export default function ListDepartment() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lọc
  const [searchName, setSearchName] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ name: '', trangThai: '' });

  // Modals
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });

  const handleApplyFilter = () => {
    setAppliedFilters({ name: searchName, trangThai: filterTrangThai });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await phongBanService.getAll();
      const listPB = res.data?.data || res.data || [];
      setData(Array.isArray(listPB) && listPB.length > 0 ? listPB : MOCK_PHONG_BAN);
    } catch (error) {
      toast.info('Không kết nối được API, đang hiển thị dữ liệu phòng ban mẫu.');
      setData(MOCK_PHONG_BAN);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      if (!item) return false;
      const matchName = (item.tenPhongBan || '').toLowerCase().includes((appliedFilters.name || '').toLowerCase());
      const matchTrangThai = appliedFilters.trangThai ? String(item.trangThai) === String(appliedFilters.trangThai) : true;
      return matchName && matchTrangThai;
    });
  }, [data, appliedFilters]);

  const columns = [
    { key: 'tenPhongBan', label: 'Tên phòng ban', sortable: true },
    { key: 'moTa', label: 'Mô tả', sortable: false },
    { 
      key: 'trangThai', 
      label: 'Trạng thái', 
      sortable: true,
      render: (val) => {
        // Ánh xạ sang các trạng thái chuẩn của StatusBadge
        let mappedStatus = 'DANG_LAM_VIEC'; // màu xanh lá
        let label = 'Hoạt động';
        
        if (val === 'NGUNG_HOAT_DONG') {
          mappedStatus = 'NGHI_VIEC'; // màu đỏ/xám
          label = 'Ngừng hoạt động';
        }
        
        return <StatusBadge status={mappedStatus} customLabel={label} />;
      }
    }
  ];

  return (
    <div className="list-department-container animate-fade-in">
      <PageHeader 
        title="Quản lý Phòng ban" 
        subtitle="Danh sách phòng ban và các bộ phận"
      />

      <div className="surface-card p-4 mb-4 filter-container">
        <Row className="align-items-end g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Tìm theo tên</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Nhập tên phòng ban..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select 
                value={filterTrangThai}
                onChange={(e) => setFilterTrangThai(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="HOAT_DONG">Hoạt động</option>
                <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Button 
              variant="outline-primary" 
              className="w-100 d-inline-flex align-items-center justify-content-center gap-2" 
              onClick={handleApplyFilter}
            >
              <BsFilter />
              Lọc
            </Button>
          </Col>
          <Col md={4} className="text-md-end text-start">
            <Button 
              variant="primary" 
              onClick={() => navigate('/nhan-su/phong-ban/them-moi')}
              className="d-inline-flex align-items-center gap-2"
            >
              <BsBuildingAdd />
              Thêm Phòng ban
            </Button>
          </Col>
        </Row>
      </div>

      <DataTable 
        columns={columns}
        data={filteredData}
        loading={loading}
        searchable={false}
        onView={(row) => setDetailModal({ show: true, data: row })}
        onEdit={(row) => navigate(`/nhan-su/phong-ban/them-moi?id=${row.id}`, { state: { initialData: row } })}
        onDelete={(row) => setDeleteModal({ show: true, data: row })}
      />

      {detailModal.show && detailModal.data && (
        <DetailDepartment 
          data={detailModal.data} 
          onClose={() => setDetailModal({ show: false, data: null })} 
        />
      )}

      {deleteModal.show && deleteModal.data && (
        <DeleteDepartment 
          data={deleteModal.data} 
          onClose={() => setDeleteModal({ show: false, data: null })}
          onSuccess={() => {
            setDeleteModal({ show: false, data: null });
            fetchData();
          }}
        />
      )}
    </div>
  );
}
