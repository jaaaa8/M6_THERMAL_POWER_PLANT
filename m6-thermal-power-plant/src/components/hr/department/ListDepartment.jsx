import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { BsFilter, BsTrash } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '../../../services/hr/departmentService';
import PageHeader from '../../common/PageHeader';
import DataTable from '../../common/DataTable';
import DeleteDepartment from './DeleteDepartment';
import './style/ListDepartment.css';

export default function ListDepartment() {
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await departmentService.getAll();
      const listPB = res.data?.data || res.data || [];
      setData(Array.isArray(listPB) ? listPB : []);
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
      const matchName = (item.name || '').toLowerCase().includes((appliedFilters.name || '').toLowerCase());
      return matchName;
    });
    return result.map((item, index) => ({ ...item, stt: index + 1 }));
  }, [data, appliedFilters]);

  const columns = [
    { key: 'stt', label: 'STT', sortable: false },
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
