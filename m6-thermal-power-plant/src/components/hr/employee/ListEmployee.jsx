import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsPersonPlusFill, BsFilter, BsEye, BsPencil, BsTrash, BsKey } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { employeeService } from '../../../services/employeeService';
import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';
import StatusBadge from '../../common/StatusBadge';
import DetailEmployee from './DetailEmployee';
import DeleteEmployee from './DeleteEmployee';
import GrantAccountModal from './GrantAccountModal';
import './style/ListEmployee.css';

const MOCK_PHONG_BAN = [
  { id: 1, tenPhongBan: 'Phòng Kỹ thuật' },
  { id: 2, tenPhongBan: 'Phòng Hành chính Nhân sự' },
  { id: 3, tenPhongBan: 'Phòng Kế toán' },
];

const MOCK_NHAN_SU = [
  { id: 1, hoVaTen: 'Nguyễn Văn An', tenDangNhap: 'an.nguyen', email: 'an.nguyen@powerplant.vn', soDienThoai: '0912345678', maPhongBan: 1, chucVu: 'Kỹ sư trưởng', chuyenMon: 'Kỹ thuật điện', trangThai: 'DANG_LAM_VIEC', avatarUrl: '' },
  { id: 2, hoVaTen: 'Trần Thị Mai', tenDangNhap: 'mai.tran', email: 'mai.tran@powerplant.vn', soDienThoai: '0987654321', maPhongBan: 2, chucVu: 'Chuyên viên HCNS', chuyenMon: 'Quản trị nhân lực', trangThai: 'DANG_LAM_VIEC', avatarUrl: '' },
  { id: 3, hoVaTen: 'Lê Bảo Khoa', tenDangNhap: 'khoa.le', email: 'khoa.le@powerplant.vn', soDienThoai: '0909112233', maPhongBan: 1, chucVu: 'Kỹ thuật viên', chuyenMon: 'Bảo trì cơ khí', trangThai: 'NGHI_PHEP', avatarUrl: '' },
  { id: 4, hoVaTen: 'Phạm Minh Tuấn', tenDangNhap: 'tuan.pham', email: 'tuan.pham@powerplant.vn', soDienThoai: '0933445566', maPhongBan: 3, chucVu: 'Kế toán viên', chuyenMon: 'Kế toán tổng hợp', trangThai: 'NGHI_VIEC', avatarUrl: '' },
  { id: 5, hoVaTen: 'Hoàng Ánh Nguyệt', tenDangNhap: 'nguyet.hoang', email: 'nguyet.hoang@powerplant.vn', soDienThoai: '0944556677', maPhongBan: 2, chucVu: 'Trưởng phòng HCNS', chuyenMon: 'Quản trị kinh doanh', trangThai: 'DANG_LAM_VIEC', avatarUrl: '' }
];

export default function ListEmployee() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lọc
  const [phongBanList, setPhongBanList] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [filterPhongBan, setFilterPhongBan] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ name: '', phongBan: '' });

  // Modals
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });
  const [grantModal, setGrantModal] = useState({ show: false, data: null });

  const handleApplyFilter = () => {
    setAppliedFilters({ name: searchName, phongBan: filterPhongBan });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resNhanSu, resPhongBan] = await Promise.all([
        employeeService.getAll(),
        employeeService.getPhongBanList()
      ]);
      const listNhanSu = resNhanSu.data?.data || resNhanSu.data || [];
      setData(Array.isArray(listNhanSu) && listNhanSu.length > 0 ? listNhanSu : MOCK_NHAN_SU);

      const listPB = resPhongBan.data?.data || resPhongBan.data || [];
      setPhongBanList(Array.isArray(listPB) && listPB.length > 0 ? listPB : MOCK_PHONG_BAN);
    } catch (error) {
      toast.info('Không kết nối được API, đang hiển thị dữ liệu mẫu.');
      setData(MOCK_NHAN_SU);
      setPhongBanList(MOCK_PHONG_BAN);
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
      const matchName = (item.hoVaTen || '').toLowerCase().includes((appliedFilters.name || '').toLowerCase());
      const matchPhongBan = appliedFilters.phongBan ? String(item.maPhongBan) === String(appliedFilters.phongBan) : true;
      return matchName && matchPhongBan;
    });
  }, [data, appliedFilters]);

  const columns = [
    { key: 'hoVaTen', label: 'Họ và tên', sortable: true },
    { key: 'tenDangNhap', label: 'Tên đăng nhập', sortable: true },
    { key: 'chucVu', label: 'Chức vụ', sortable: true },
    { 
      key: 'maPhongBan', 
      label: 'Phòng ban', 
      sortable: true,
      render: (val) => {
        const pb = phongBanList.find(p => String(p.id) === String(val));
        return pb ? pb.tenPhongBan : val;
      }
    },
    { key: 'soDienThoai', label: 'SĐT', sortable: false, mono: true },
    { 
      key: 'trangThai', 
      label: 'Trạng thái', 
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    }
  ];

  return (
    <div className="list-employee-container animate-fade-in">
      <PageHeader 
        title="Quản lý Nhân viên" 
        subtitle="Danh sách nhân viên và thông tin cơ bản"
      />

      <div className="surface-card p-4 mb-4 filter-container">
        <Row className="align-items-end g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Tìm theo tên</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Nhập tên nhân viên..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Phòng ban</Form.Label>
              <Form.Select 
                value={filterPhongBan}
                onChange={(e) => setFilterPhongBan(e.target.value)}
              >
                <option value="">Tất cả phòng ban</option>
                {phongBanList.map(pb => (
                  <option key={pb.id} value={pb.id}>{pb.tenPhongBan}</option>
                ))}
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
              onClick={() => navigate('/nhan-su/them-moi')}
              className="d-inline-flex align-items-center gap-2"
            >
              <BsPersonPlusFill />
              Thêm Nhân sự
            </Button>
          </Col>
        </Row>
      </div>

      <DataTable 
        columns={columns}
        data={filteredData}
        loading={loading}
        searchable={false} // Tắt search mặc định vì đã có filter custom
        renderActions={(row) => (
          <div className="data-table-actions">
            <button className="btn btn-sm btn-outline-success" onClick={() => setGrantModal({ show: true, data: row })} title="Cấp tài khoản">
              <BsKey />
            </button>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setDetailModal({ show: true, data: row })} title="Xem">
              <BsEye />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/nhan-su/them-moi?id=${row.id}`, { state: { initialData: row } })} title="Sửa">
              <BsPencil />
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteModal({ show: true, data: row })} title="Xoá">
              <BsTrash />
            </button>
          </div>
        )}
      />

      {grantModal.show && grantModal.data && (
        <GrantAccountModal 
          data={grantModal.data} 
          onClose={() => setGrantModal({ show: false, data: null })}
          onSuccess={() => {
            setGrantModal({ show: false, data: null });
            fetchData();
          }}
        />
      )}

      {detailModal.show && detailModal.data && (
        <DetailEmployee 
          data={detailModal.data} 
          phongBanList={phongBanList}
          onClose={() => setDetailModal({ show: false, data: null })} 
        />
      )}

      {deleteModal.show && deleteModal.data && (
        <DeleteEmployee 
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
