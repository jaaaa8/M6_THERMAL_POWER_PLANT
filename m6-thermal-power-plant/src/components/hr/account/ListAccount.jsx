import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsPersonPlusFill, BsFilter, BsEye, BsPencil, BsLock, BsUnlock, BsArrowClockwise } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { accountService } from '../../../services/hr/accountService';
import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';
import DetailAccount from './DetailAccount';
import DeleteAccount from './DeleteAccount';
import './style/ListAccount.css';

export default function ListAccount() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lọc
  const [roles, setRoles] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchEmployeeName, setSearchEmployeeName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    username: '',
    email: '',
    employeeName: '',
    role: '',
    status: ''
  });

  // Modals
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });

  const handleApplyFilter = () => {
    setAppliedFilters({
      username: searchUsername,
      email: searchEmail,
      employeeName: searchEmployeeName,
      role: filterRole,
      status: filterStatus
    });
  };

  const handleClearFilters = () => {
    setSearchUsername('');
    setSearchEmail('');
    setSearchEmployeeName('');
    setFilterRole('');
    setFilterStatus('');
    setAppliedFilters({
      username: '',
      email: '',
      employeeName: '',
      role: '',
      status: ''
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const searchParams = {
        username: appliedFilters.username || undefined,
        email: appliedFilters.email || undefined,
        employeeName: appliedFilters.employeeName || undefined,
        roleId: appliedFilters.role || undefined,
        status: appliedFilters.status || undefined,
        size: 1000
      };

      const [res, rolesRes] = await Promise.all([
        accountService.search(searchParams),
        accountService.getRoles()
      ]);
      const listTK = res.data?.content || res.data?.data || res.data || [];
      setData(Array.isArray(listTK) ? listTK : []);

      const rolesList = rolesRes.data?.data || rolesRes.data || [];
      setRoles(Array.isArray(rolesList) ? rolesList : []);
    } catch {
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
    if (!Array.isArray(data)) return [];
    return data;
  }, [data]);

  const columns = [
    { 
      key: 'username', 
      label: 'Tên đăng nhập', 
      sortable: true,
      render: (val, row) => (
        <div className="d-flex align-items-center gap-2">
          {row.image ? (
            <img 
              src={row.image.startsWith('http') ? row.image : `${import.meta.env.VITE_API_BASE_URL || ''}${row.image}`} 
              alt={val} 
              className="rounded-circle object-fit-cover" 
              style={{ width: '32px', height: '32px' }}
            />
          ) : (
            <div 
              className="text-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-7" 
              style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-secondary-container)' }}
            >
              {val ? val.trim()[0].toUpperCase() : 'U'}
            </div>
          )}
          <span className="fw-medium">{val}</span>
        </div>
      )
    },
    {
      key: 'employee',
      label: 'Nhân viên',
      sortable: true,
      render: (val) => val?.fullName || ''
    },
    {
      key: 'email',
      label: 'Email',
      sortable: false,
      render: (val, row) => val || row.employee?.gmail || ''
    },
    {
      key: 'roles',
      label: 'Vai trò',
      sortable: true,
      render: (val) => val?.[0]?.name || ''
    },
    {
      key: 'status',
      label: 'Trạng thái',
      sortable: true,
      render: (val) => {
        if (!val) return '';
        const isLocked = val === 'LOCKED' || val === 'KHOA';
        return <span className={isLocked ? 'text-danger fw-bold' : 'text-success fw-bold'}>{val}</span>;
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
        <Row className="g-2 align-items-end">
          <Col lg={2} md={4} xs={6}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Tên đăng nhập</Form.Label>
              <Form.Control
                type="text"
                size="sm"
                placeholder="Username..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col lg={2} md={4} xs={6}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Họ và tên</Form.Label>
              <Form.Control
                type="text"
                size="sm"
                placeholder="Tên nhân viên..."
                value={searchEmployeeName}
                onChange={(e) => setSearchEmployeeName(e.target.value)}
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
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col lg="auto" md={4} xs={6} style={{ width: '12%' }}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Vai trò</Form.Label>
              <Form.Select
                size="sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Tất cả</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg="auto" md={4} xs={6} style={{ width: '11%' }}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Trạng thái</Form.Label>
              <Form.Select
                size="sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="LOCKED">LOCKED</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg="auto" md={6} xs={12} className="d-flex gap-2 mt-2 mt-lg-0 align-items-end">
            <Button
              variant="outline-primary"
              size="sm"
              className="d-inline-flex align-items-center justify-content-center gap-1 px-3"
              onClick={handleApplyFilter}
            >
              <BsFilter />
              Lọc
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-inline-flex align-items-center justify-content-center gap-1 px-3"
              onClick={handleClearFilters}
            >
              <BsArrowClockwise />
              Bỏ lọc
            </Button>
          </Col>
          <Col className="ms-auto text-end mt-2 mt-lg-0 align-self-end">
            <Button
              variant="primary"
              size="sm"
              className="d-inline-flex align-items-center justify-content-center gap-1 px-3"
              onClick={() => navigate('/hr/accounts/create')}
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
            {row.status === 'LOCKED' ? (
              <button className="btn btn-sm btn-outline-success" onClick={() => setDeleteModal({ show: true, data: row, action: 'UNLOCK' })} title="Mở khoá tài khoản">
                <BsUnlock />
              </button>
            ) : (
              <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteModal({ show: true, data: row, action: 'LOCK' })} title="Khoá tài khoản">
                <BsLock />
              </button>
            )}
            <button className="btn btn-sm btn-outline-primary" onClick={() => setDetailModal({ show: true, data: row })} title="Xem">
              <BsEye />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/hr/accounts/create?id=${row.id}`, { state: { initialData: row } })} title="Sửa">
              <BsPencil />
            </button>
          </div>
        )}
      />

      {detailModal.show && detailModal.data && (
        <DetailAccount
          data={detailModal.data}
          onClose={() => setDetailModal({ show: false, data: null })}
        />
      )}

      {deleteModal.show && deleteModal.data && (
        <DeleteAccount
          data={deleteModal.data}
          action={deleteModal.action}
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
