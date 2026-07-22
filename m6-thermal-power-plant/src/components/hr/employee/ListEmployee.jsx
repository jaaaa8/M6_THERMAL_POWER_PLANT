import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsPersonPlusFill, BsFilter, BsEye, BsPencil, BsTrash, BsKey, BsLock, BsUnlock, BsArrowClockwise } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { employeeService } from '../../../services/hr/employeeService';

import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';

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
  const [searchPhone, setSearchPhone] = useState('');
  const [searchGmail, setSearchGmail] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterIsActive, setFilterIsActive] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    phone: '',
    gmail: '',
    department: '',
    isActive: ''
  });

  // Modals
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });
  const [grantModal, setGrantModal] = useState({ show: false, data: null });
  const [deleteAccountModal, setDeleteAccountModal] = useState({ show: false, data: null });

  const handleApplyFilter = () => {
    setAppliedFilters({
      name: searchName,
      phone: searchPhone,
      gmail: searchGmail,
      department: filterDepartment,
      isActive: filterIsActive
    });
  };

  const handleClearFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchGmail('');
    setFilterDepartment('');
    setFilterIsActive('');
    setAppliedFilters({
      name: '',
      phone: '',
      gmail: '',
      department: '',
      isActive: ''
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const searchParams = {
        name: appliedFilters.name || undefined,
        phone: appliedFilters.phone || undefined,
        gmail: appliedFilters.gmail || undefined,
        departmentId: appliedFilters.department || undefined,
        isActive: appliedFilters.isActive !== '' ? appliedFilters.isActive === 'true' : undefined,
        size: 1000
      };

      const [resNhanSu, resPhongBan] = await Promise.all([
        employeeService.search(searchParams),
        employeeService.getDepartments()
      ]);
      
      const listNhanSu = resNhanSu.data?.content || resNhanSu.data?.data?.content || resNhanSu.data || [];
      const mappedList = (Array.isArray(listNhanSu) ? listNhanSu : []).map(emp => ({
        ...emp,
        username: emp.account?.username || null,
        status: emp.account?.status || null,
        roles: emp.account?.roles || null
      }));
      setData(mappedList);

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
  }, [appliedFilters]);


  const filteredData = useMemo(() => {
    return data;
  }, [data]);

  const columns = [
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
        <Row className="g-2 align-items-end">
          <Col lg={2} md={4} xs={6}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Họ và tên</Form.Label>
              <Form.Control 
                type="text" 
                size="sm"
                placeholder="Tên nhân viên..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col lg="auto" md={4} xs={6} style={{ width: '14%' }}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">STĐ</Form.Label>
              <Form.Control 
                type="text" 
                size="sm"
                placeholder="SĐT..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col lg={2} md={4} xs={6}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Email</Form.Label>
              <Form.Control 
                type="text" 
                size="sm"
                placeholder="Email..."
                value={searchGmail}
                onChange={(e) => setSearchGmail(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col lg="auto" md={4} xs={6} style={{ width: '12%' }}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Phòng ban</Form.Label>
              <Form.Select 
                size="sm"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="">Tất cả</option>
                {departments.map(pb => (
                  <option key={pb.id} value={pb.id}>{pb.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg="auto" md={4} xs={6} style={{ width: '11%' }}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Trạng thái</Form.Label>
              <Form.Select 
                size="sm"
                value={filterIsActive}
                onChange={(e) => setFilterIsActive(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="true">Làm việc</option>
                <option value="false">Nghỉ việc</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg="auto" md={12} xs={12} className="flex-grow-1 d-flex gap-2 mt-2 mt-lg-0 align-items-end">
            <Button 
              variant="outline-primary" 
              size="sm"
              className="flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1" 
              onClick={handleApplyFilter}
            >
              <BsFilter />
              Lọc
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              className="d-inline-flex align-items-center justify-content-center gap-1" 
              onClick={handleClearFilters}
            >
              <BsArrowClockwise />
              Bỏ lọc
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              className="flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={() => navigate('/hr/employees/create')}
            >
              <BsPersonPlusFill />
              Thêm
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
                <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteAccountModal({ show: true, data: row, action: 'LOCK' })} title="Khoá tài khoản">
                <BsLock />
                </button>
            )}
            <button className="btn btn-sm btn-outline-primary" onClick={() => setDetailModal({ show: true, data: row })} title="Xem">
              <BsEye />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/hr/employees/edit/${row.id}`)} title="Sửa">
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
          onRefreshList={fetchData}
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
