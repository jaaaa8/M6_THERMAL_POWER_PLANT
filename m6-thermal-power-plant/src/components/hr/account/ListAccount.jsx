import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsPersonPlusFill, BsFilter } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { taiKhoanService } from '../../../services/taiKhoanService';
import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';
import StatusBadge from '../../common/StatusBadge';
import DetailAccount from './DetailAccount';
import DeleteAccount from './DeleteAccount';
import './style/ListAccount.css';

const MOCK_TAI_KHOAN = [
  { id: 1, tenDangNhap: 'an.nguyen', hoVaTen: 'Nguyễn Văn An', email: 'an.nguyen@powerplant.vn', vaiTro: 'QUAN_TRI', trangThai: 'HOAT_DONG' },
  { id: 2, tenDangNhap: 'mai.tran', hoVaTen: 'Trần Thị Mai', email: 'mai.tran@powerplant.vn', vaiTro: 'QUAN_LY_NS', trangThai: 'HOAT_DONG' },
  { id: 3, tenDangNhap: 'khoa.le', hoVaTen: 'Lê Bảo Khoa', email: 'khoa.le@powerplant.vn', vaiTro: 'NHAN_VIEN', trangThai: 'KHOA' },
  { id: 4, tenDangNhap: 'tuan.pham', hoVaTen: 'Phạm Minh Tuấn', email: 'tuan.pham@powerplant.vn', vaiTro: 'NHAN_VIEN', trangThai: 'HOAT_DONG' },
];

const MAP_VAI_TRO = {
  QUAN_TRI: 'Quản trị viên',
  QUAN_LY_NS: 'Quản lý Nhân sự',
  NHAN_VIEN: 'Nhân viên'
};

export default function ListAccount() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVaiTro, setFilterVaiTro] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ query: '', vaiTro: '', trangThai: '' });

  // Modals
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });

  const handleApplyFilter = () => {
    setAppliedFilters({ query: searchQuery, vaiTro: filterVaiTro, trangThai: filterTrangThai });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await taiKhoanService.getAll();
      const listTK = res.data?.data || res.data || [];
      setData(Array.isArray(listTK) && listTK.length > 0 ? listTK : MOCK_TAI_KHOAN);
    } catch (error) {
      toast.info('Không kết nối được API, đang hiển thị dữ liệu mẫu.');
      setData(MOCK_TAI_KHOAN);
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
      const lowerQuery = (appliedFilters.query || '').toLowerCase();
      const matchQuery = 
        (item.tenDangNhap || '').toLowerCase().includes(lowerQuery) || 
        (item.hoVaTen || '').toLowerCase().includes(lowerQuery);
      
      const matchVaiTro = appliedFilters.vaiTro ? String(item.vaiTro) === String(appliedFilters.vaiTro) : true;
      const matchTrangThai = appliedFilters.trangThai ? String(item.trangThai) === String(appliedFilters.trangThai) : true;
      
      return matchQuery && matchVaiTro && matchTrangThai;
    });
  }, [data, appliedFilters]);

  const columns = [
    { key: 'tenDangNhap', label: 'Tên đăng nhập', sortable: true },
    { key: 'hoVaTen', label: 'Họ và tên', sortable: true },
    { key: 'email', label: 'Email', sortable: false },
    { 
      key: 'vaiTro', 
      label: 'Vai trò', 
      sortable: true,
      render: (val) => MAP_VAI_TRO[val] || val
    },
    { 
      key: 'trangThai', 
      label: 'Trạng thái', 
      sortable: true,
      render: (val) => {
        let mappedStatus = 'DANG_LAM_VIEC'; 
        let label = 'Hoạt động';
        
        if (val === 'KHOA' || val === 'DANG_KHOA') {
          mappedStatus = 'NGHI_VIEC'; 
          label = 'Đã khóa';
        }
        
        return <StatusBadge status={mappedStatus} customLabel={label} />;
      }
    }
  ];

  return (
    <div className="list-account-container animate-fade-in">
      <PageHeader 
        title="Tài khoản & Phân quyền" 
        subtitle="Quản lý tài khoản đăng nhập và phân quyền hệ thống"
      />

      <div className="surface-card p-4 mb-4 filter-container">
        <Row className="align-items-end g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Tìm kiếm</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Nhập tên đăng nhập hoặc họ tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label>Vai trò</Form.Label>
              <Form.Select 
                value={filterVaiTro}
                onChange={(e) => setFilterVaiTro(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="QUAN_TRI">Quản trị viên</option>
                <option value="QUAN_LY_NS">Quản lý NS</option>
                <option value="NHAN_VIEN">Nhân viên</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select 
                value={filterTrangThai}
                onChange={(e) => setFilterTrangThai(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="HOAT_DONG">Hoạt động</option>
                <option value="KHOA">Đã khóa</option>
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
          <Col md={3} className="text-md-end text-start">
            <Button 
              variant="primary" 
              onClick={() => navigate('/nhan-su/tai-khoan/them-moi')}
              className="d-inline-flex align-items-center gap-2"
            >
              <BsPersonPlusFill />
              Thêm Tài khoản
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
        onEdit={(row) => navigate(`/nhan-su/tai-khoan/them-moi?id=${row.id}`, { state: { initialData: row } })}
        onDelete={(row) => setDeleteModal({ show: true, data: row })}
      />

      {detailModal.show && detailModal.data && (
        <DetailAccount 
          data={detailModal.data} 
          mapVaiTro={MAP_VAI_TRO}
          onClose={() => setDetailModal({ show: false, data: null })} 
        />
      )}

      {deleteModal.show && deleteModal.data && (
        <DeleteAccount 
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
