import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Modal } from 'react-bootstrap';
import { BsSearch, BsPlusLg, BsEye, BsPencil, BsTrash, BsX, BsGearWideConnected } from 'react-icons/bs';
import { systemService } from '../../services/systemService';
import PageHeader from '../common/PageHeader';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import './style/ListSystem.css';
import ConfirmModal from '../common/ConfirmModal';
import { toast } from 'react-toastify';


export default function ListSystem() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [, setTotalPages] = useState(0);

  // Bộ lọc tìm kiếm
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async (
    keyword = "",
    status = "",
    page = 0
  ) => {
    setLoading(true);

    try {
      const res = await systemService.getAll(
        keyword,
        status,
        page,
        size
      );
      console.log("Response:", res);
      console.log("Content:", res.data.content);

      setData(res.data.content);
      console.log(res.data.content);
      setTotalPages(res.data.totalPages);
      setPage(res.data.number);

    } catch (e) {
      console.log(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData("", "", 0);
  }, []);



  // Hành động nhấn nút Tìm kiếm
  const handleApplyFilter = () => {
    fetchData(
      searchName,
      filterStatus,
      0
    );
  };

  // Modals
  const [detailModal, setDetailModal] = useState({ show: false, data: null });

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    data: null,
  });
  const [deleting, setDeleting] = useState(false);
  // Cột hiển thị bảng
  const columns = [

    {
      key: "code",
      label: "Mã hệ thống"
    },

    {
      key: "name",
      label: "Tên hệ thống"
    },

    {
      key: "description",
      label: "Mô tả"
    },

    {
      key: "status",
      label: "Trạng thái",
      render: (value) => {

        switch (value) {

          case "ACTIVE":
            return (
              <StatusBadge
                status="normal"
                label="Hoạt động"
              />
            );

          case "MAINTENANCE":
            return (
              <StatusBadge
                status="warning"
                label="Bảo dưỡng"
              />
            );

          case "FAILURE":
            return (
              <StatusBadge
                status="danger"
                label="Sự cố"
              />
            );

          case "STANDBY":
            return (
              <StatusBadge
                status="secondary"
                label="Dự phòng"
              />
            );

          case "RETIRED":
            return (
              <StatusBadge
                status="inactive"
                label="Thanh lý"
              />
            );

          default:
            return value;
        }
      }
    }

  ];

  const handleDelete = async () => {
    try {
      setDeleting(true);

      await systemService.remove(deleteModal.data.id);

      toast.success("Xóa hệ thống thành công");

      setDeleteModal({
        show: false,
        data: null,
      });

      fetchData(searchName, filterStatus, page);

    } catch (e) {
      console.log(e);
      toast.error("Không thể xóa hệ thống");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="list-system-container animate-fade-in">
      <PageHeader
        title="Danh sách Hệ thống"
        subtitle="Quản lý thông tin hệ thống kỹ thuật của nhà máy điện"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/equipment/system/add')}
            className="d-inline-flex align-items-center gap-2 px-3"
          >
            <BsPlusLg />
            Thêm hệ thống
          </Button>
        }
      />

      {/* Thanh Bộ Lọc Tìm Kiếm */}
      <div className="search-filter-card p-4">
        <Row className="align-items-end g-3">
          <Col md={4} sm={12}>
            <Form.Group>
              <Form.Label htmlFor="searchName">Tìm kiếm tên hệ thống...</Form.Label>
              <Form.Control
                id="searchName"
                type="text"
                placeholder="Tìm kiếm tên hệ thống..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilter();
                }}
              />
            </Form.Group>
          </Col>

          <Col md={3} sm={6}>
            <Form.Group>
              <Form.Label htmlFor="filterStatus">Trạng thái</Form.Label>
              <Form.Select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="MAINTENANCE">Bảo dưỡng</option>
                <option value="FAILURE">Sự cố</option>
                <option value="STANDBY">Dự phòng</option>
                <option value="RETIRED">Thanh lý</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2} sm={12} className="text-end">
            <Button
              variant="primary"
              className="w-100 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={handleApplyFilter}
            >
              <BsSearch />
              Tìm kiếm
            </Button>
          </Col>
        </Row>
      </div>

      {/* Bảng Dữ Liệu */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable={false}
        pageSize={10}
        renderActions={(row) => (
          <div className="d-flex align-items-center gap-2 justify-content-start">
            <button
              className="system-action-btn view-btn"
              title="Xem chi tiết"
              onClick={() => setDetailModal({ show: true, data: row })}
            >
              <BsEye size={16} />
            </button>
            <button
              className="system-action-btn edit-btn"
              title="Chỉnh sửa"
              onClick={() => navigate(`/equipment/system/edit/${row.id}`)}
            >
              <BsPencil size={14} />
            </button>
            <button
              className="system-action-btn delete-btn"
              title="Xóa"
              onClick={() =>
                setDeleteModal({
                  show: true,
                  data: row,
                })
              }
            >
              <BsTrash size={14} />
            </button>
          </div>
        )}
      />

      {/* Modal Xem Chi Tiết */}
      {detailModal.show && detailModal.data && (
        <ViewSystemModal
          data={detailModal.data}
          onClose={() => setDetailModal({ show: false, data: null })}
        />
      )}
      {/* Modal xác nhận xóa */}
      <ConfirmModal
        show={deleteModal.show}
        onClose={() =>
          setDeleteModal({
            show: false,
            data: null,
          })
        }
        onConfirm={handleDelete}
        loading={deleting}
        title="Xóa hệ thống"
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        message={
          deleteModal.data
            ? `Bạn có chắc chắn muốn xóa hệ thống "${deleteModal.data.name}" (${deleteModal.data.code}) không?`
            : ""
        }
      />

    </div>
  );
}

/* ============================================================
   Component Modal Xem Chi Tiết
   ============================================================ */
function ViewSystemModal({ data, onClose }) {
  return (
    <Modal show={true} onHide={onClose} size="md" centered className="animate-slide-down">
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <BsGearWideConnected className="text-primary" />
          <span>Chi tiết Hệ thống</span>
        </Modal.Title>
        <Button variant="light" className="btn-close-custom ms-auto" onClick={onClose}>
          <BsX size={24} />
        </Button>
      </Modal.Header>
      <Modal.Body className="px-4 py-4">

        <div className="text-center mb-4">
          <div className="system-avatar">
            <BsGearWideConnected size={36} />
          </div>

          <h4 className="fw-bold mt-3 mb-1">
            {data.name}
          </h4>

          <div className="text-secondary">
            {data.code}
          </div>

          <div className="mt-3">
            <StatusBadge
              status={
                data.status === "ACTIVE"
                  ? "normal"
                  : data.status === "MAINTENANCE"
                    ? "warning"
                    : data.status === "FAILURE"
                      ? "danger"
                      : data.status === "STANDBY"
                        ? "secondary"
                        : "inactive"
              }
              label={
                data.status === "ACTIVE"
                  ? "Hoạt động"
                  : data.status === "MAINTENANCE"
                    ? "Bảo dưỡng"
                    : data.status === "FAILURE"
                      ? "Sự cố"
                      : data.status === "STANDBY"
                        ? "Dự phòng"
                        : "Thanh lý"
              }
            />
          </div>
        </div>

        <div className="detail-card">

          <div className="detail-row">
            <span className="detail-title">
              Mã hệ thống
            </span>

            <span className="detail-content">
              {data.code}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-title">
              Tên hệ thống
            </span>

            <span className="detail-content">
              {data.name}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-title">
              Trạng thái
            </span>

            <span className="detail-content">
              <StatusBadge
                status={
                  data.status === "ACTIVE"
                    ? "normal"
                    : data.status === "MAINTENANCE"
                      ? "warning"
                      : data.status === "FAILURE"
                        ? "danger"
                        : data.status === "STANDBY"
                          ? "secondary"
                          : "inactive"
                }
                label={
                  data.status === "ACTIVE"
                    ? "Hoạt động"
                    : data.status === "MAINTENANCE"
                      ? "Bảo dưỡng"
                      : data.status === "FAILURE"
                        ? "Sự cố"
                        : data.status === "STANDBY"
                          ? "Dự phòng"
                          : "Thanh lý"
                }
              />
            </span>
          </div>

          <div className="detail-description">
            <div className="detail-title mb-2">
              Mô tả
            </div>

            <div className="description-box">
              {data.description || "Chưa có mô tả"}
            </div>
          </div>

        </div>

      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 justify-content-end px-4">
        <Button variant="outline-primary" onClick={onClose} className="px-4">
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
