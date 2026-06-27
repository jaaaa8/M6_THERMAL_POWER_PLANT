import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsPersonPlusFill, BsFilter, BsEye, BsPencil, BsLock, BsUnlock } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { accountService } from '../../../services/hr/accountService';
import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';
import StatusBadge from '../../common/StatusBadge';
import DetailAccount from './DetailAccount';
import DeleteAccount from './DeleteAccount';
import './style/ListAccount.css';

export default function ListAccount() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lọc
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ query: '', role: '', status: '' });

  // Modals
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });

  const handleApplyFilter = () => {
    setAppliedFilters({ query: searchQuery, role: filterRole, status: filterStatus });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, rolesRes] = await Promise.all([
        accountService.getAll(),
        accountService.getRoles()
      ]);
      const listTK = res.data?.data || res.data || [];
      setData(Array.isArray(listTK) ? listTK : []);

      const rolesList = rolesRes.data?.data || rolesRes.data || [];
      setRoles(Array.isArray(rolesList) ? rolesList : []);
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
    return data.filter(item => {
      if (!item) return false;
      const lowerQuery = (appliedFilters.query || '').toLowerCase();
      const matchQuery =
        (item.username || '').toLowerCase().includes(lowerQuery) ||
        (item.employee?.fullName || '').toLowerCase().includes(lowerQuery);

      const matchVaiTro = appliedFilters.role ? String(item.roles?.[0]?.id) === String(appliedFilters.role) : true;
      const matchTrangThai = appliedFilters.status ? String(item.status) === String(appliedFilters.status) : true;

      return matchQuery && matchVaiTro && matchTrangThai;
    });
  }, [data, appliedFilters]);

  const columns = [
    { key: 'username', label: 'Tên đăng nhập', sortable: true },
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
          <Col md={2}>
            <Form.Group>
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="LOCKED">LOCKED</option>
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
        renderActions={(row) => (
          <div className="data-table-actions">
            <button className="btn btn-sm btn-outline-primary" onClick={() => setDetailModal({ show: true, data: row })} title="Xem">
              <BsEye />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/nhan-su/tai-khoan/them-moi?id=${row.id}`, { state: { initialData: row } })} title="Sửa">
              <BsPencil />
            </button>
            {row.status === 'LOCKED' ? (
              <button className="btn btn-sm btn-outline-success" onClick={() => setDeleteModal({ show: true, data: row, action: 'UNLOCK' })} title="Mở khoá tài khoản">
                <BsUnlock />
              </button>
            ) : (
              <button className="btn btn-sm btn-outline-warning" onClick={() => setDeleteModal({ show: true, data: row, action: 'LOCK' })} title="Khoá tài khoản">
                <BsLock />
              </button>
            )}
          </div>
        )}
      />

      {detailModal.show && detailModal.data && (
        <DetailAccount
          data={detailModal.data}
          mapVaiTro={{}}
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
