import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsFilter, BsTrash, BsPlusLg, BsArrowClockwise } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '../../../services/hr/departmentService';
import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';
import DeleteDepartment from './DeleteDepartment';
import './style/ListDepartment.css';

export default function ListDepartment() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lọc
  const [searchName, setSearchName] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ name: '' });

  // Modals
  const [deleteModal, setDeleteModal] = useState({ show: false, data: null });

  const handleApplyFilter = () => {
    setAppliedFilters({ name: searchName });
  };

  const handleClearFilters = () => {
    setSearchName('');
    setAppliedFilters({ name: '' });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await departmentService.getAll();
      const listPB = res.data?.data || res.data || [];
      setData(Array.isArray(listPB) ? listPB : []);
    } catch {
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
      const matchName = (item.name || '').toLowerCase().includes((appliedFilters.name || '').toLowerCase());
      return matchName;
    });
    return result.map((item, index) => ({ ...item, stt: index + 1 }));
  }, [data, appliedFilters]);

  const columns = [
    { key: 'departmentCode', label: 'Mã phòng ban', sortable: true },
    { key: 'name', label: 'Tên phòng ban', sortable: true },
    { key: 'description', label: 'Mô tả', sortable: false }
  ];

  return (
    <div className="list-department-container animate-fade-in">
      <PageHeader
        title="Quản lý Phòng ban"
        subtitle="Danh sách phòng ban và các bộ phận"

      />

      <div className="surface-card p-4 mb-4 filter-container">
        <Row className="g-2 align-items-end">
          <Col lg={3} md={6} xs={12}>
            <Form.Group>
              <Form.Label className="fs-7 text-secondary mb-1">Tên phòng ban</Form.Label>
              <Form.Control
                type="text"
                size="sm"
                placeholder="Nhập tên phòng ban..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
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
              className="d-inline-flex align-items-center justify-content-center gap-1 px-3 "
              onClick={() => navigate('/hr/departments/create')}
            >
              <BsPlusLg />
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
            <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteModal({ show: true, data: row })} title="Xoá">
              <BsTrash />
            </button>
          </div>
        )}
      />

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
