import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsPersonPlusFill, BsFilter, BsEye, BsPencil, BsTrash, BsKey, BsLock, BsUnlock } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { employeeService } from '../../../services/hr/employeeService';
import { accountService } from '../../../services/hr/accountService';
import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';
import StatusBadge from '../../common/StatusBadge';
import DetailEmployee from './DetailEmployee';
import DeleteEmployee from './DeleteEmployee';
import GrantAccountModal from './GrantAccountModal';
import DeleteAccount from '../account/DeleteAccount';
import './style/ListEmployee.css';

export default function ListEmployee() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lọc
  const [departments, setDepartments] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ name: '', department: '' });

  // Modals
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });
  const [grantModal, setGrantModal] = useState({ show: false, data: null });
  const [deleteAccountModal, setDeleteAccountModal] = useState({ show: false, data: null });

  const handleApplyFilter = () => {
    setAppliedFilters({ name: searchName, department: filterDepartment });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resNhanSu, resPhongBan] = await Promise.all([
        employeeService.getAllWithAccounts(),
        employeeService.getDepartments()
      ]);
      const listNhanSu = resNhanSu.data?.data || resNhanSu.data || [];
      setData(Array.isArray(listNhanSu) ? listNhanSu : []);

      const listPB = resPhongBan.data?.data || resPhongBan.data || [];
      setDepartments(Array.isArray(listPB) ? listPB : []);
    } catch (error) {
      toast.error('Không kết nối được API.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let result = data.filter(item => {
      if (!item) return false;
      const matchName = (item.fullName || '').toLowerCase().includes((appliedFilters.name || '').toLowerCase());
      const matchPhongBan = appliedFilters.department ? String(item.department?.id) === String(appliedFilters.department) : true;
      return matchName && matchPhongBan;
    });
    return result.map((item, index) => ({ ...item, stt: index + 1 }));
  }, [data, appliedFilters]);

  const columns = [
    { key: 'stt', label: 'STT', sortable: false },
    { key: 'employeeCode', label: 'Mã NV', sortable: true },
    { key: 'fullName', label: 'Họ và tên', sortable: true },
    { 
      key: 'department', 
      label: 'Phòng ban', 
      sortable: true,
      render: (val) => val?.name || ''
    },
    { 
      key: 'isActive', 
      label: 'Trạng thái', 
      sortable: true,
      render: (val) => <span className={val ? 'text-success fw-bold' : 'text-danger fw-bold'}>{val ? 'Đang làm việc' : 'Nghỉ việc'}</span>
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
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="">Tất cả phòng ban</option>
                {departments.map(pb => (
                  <option key={pb.id} value={pb.id}>{pb.name}</option>
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
        searchable={false}
        renderActions={(row) => (
          <div className="data-table-actions">
            {!row.username ? (
                <button className="btn btn-sm btn-outline-success" onClick={() => setGrantModal({ show: true, data: row })} title="Cấp tài khoản">
                <BsKey />
                </button>
            ) : row.status === 'LOCKED' ? (
                <button className="btn btn-sm btn-outline-success" onClick={() => setDeleteAccountModal({ show: true, data: row, action: 'UNLOCK' })} title="Mở khoá tài khoản">
                <BsUnlock />
                </button>
            ) : (
                <button className="btn btn-sm btn-outline-warning" onClick={() => setDeleteAccountModal({ show: true, data: row, action: 'LOCK' })} title="Khoá tài khoản">
                <BsLock />
                </button>
            )}
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

      {deleteAccountModal.show && deleteAccountModal.data && (
        <DeleteAccount 
          data={deleteAccountModal.data} 
          action={deleteAccountModal.action}
          onClose={() => setDeleteAccountModal({ show: false, data: null })}
          onSuccess={() => {
            setDeleteAccountModal({ show: false, data: null });
            fetchData();
          }}
        />
      )}
    </div>
  );
}
