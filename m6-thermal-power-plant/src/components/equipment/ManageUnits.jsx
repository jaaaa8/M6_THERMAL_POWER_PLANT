import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Spinner, Table, Modal } from 'react-bootstrap';
import {
  BsPlusLg,
  BsArrowLeft,
  BsTrash,
  BsPencil
} from "react-icons/bs";
import * as unitService from "../../services/equipment/unitService";
import { toast } from 'react-toastify';
import './style/ListEquipment.css';
import PaginationPanel from "./PaginationPanel";
import { useFormik } from "formik";
import * as Yup from "yup";


export default function ManageUnits() {
  const navigate = useNavigate();
  const [unitsList, setUnitsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [editingUnit, setEditingUnit] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const unitSchema = Yup.object({
    name: Yup.string()
      .trim()
      .required("Tên đơn vị không được để trống")
      .max(100, "Tên đơn vị tối đa 100 ký tự")
      .matches(
        /^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ].*$/,
        "Tên đơn vị phải bắt đầu bằng chữ cái viết hoa"
      )
      // Chỉ cho phép chữ, số, khoảng trắng
      .matches(
        /^[A-Za-zÀ-ỹ0-9\s]+$/,
        "Tên đơn vị chỉ được chứa chữ cái, số và khoảng trắng"
      ),

    description: Yup.string()
      .max(255, "Mô tả tối đa 255 ký tự")
  });
  // Fetch units list

  const fetchUnits = async (pageNumber = page, pageSize = size) => {
    setLoading(true);

    try {
      const res = await unitService.getAll(
        pageNumber,
        pageSize
      );
      setUnitsList(res.data.content);
      setPage(res.data.number);
      setSize(res.data.size);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);

    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách đơn vị");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits(0, size);
  }, []);

  // Add unit handler
  const addFormik = useFormik({
    initialValues: {
      name: "",
      description: ""
    },

    validationSchema: unitSchema,

    onSubmit: async (values, { resetForm }) => {
      try {

        await unitService.createUnit(values);

        toast.success("Thêm thành công");

        setShowAddModal(false);

        resetForm();

        fetchUnits();

      } catch (e) {

        console.log(e);

        toast.error("Thêm thất bại");
      }
    }
  });
  // Delete unit handler
  const handleDeleteUnit = async (unit) => {
    try {
      await unitService.deleteUnit(unit.id);

      await fetchUnits();

      toast.success("Xóa đơn vị thành công");
    } catch (e) {
      console.error(e);
      toast.error("Lỗi xóa đơn vị");
    }
  };

  // Update Unit
  const updateFormik = useFormik({
    enableReinitialize: true,

    initialValues: {
      name: editingUnit?.name || "",
      description: editingUnit?.description || ""
    },

    validationSchema: unitSchema,

    onSubmit: async (values, { resetForm }) => {

      try {

        await unitService.updateUnit(editingUnit.id, values);

        toast.success("Cập nhật thành công");

        setShowUpdateModal(false);

        setEditingUnit(null);

        resetForm();

        fetchUnits();

      } catch (e) {

        console.log(e);

        toast.error("Cập nhật thất bại");

      }

    }
  });
  return (
    <><><><div className="manage-units-container animate-fade-in">

      <Row className="justify-content-center mt-4">
        <Col lg={12}>
          <div className="d-flex justify-content-end mb-3">
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              <BsPlusLg className="me-2" />
              Thêm đơn vị
            </Button>
          </div>

          <div className="surface-card p-4 border rounded-lg bg-white">
            <h5 className="fw-bold mb-3">Đơn vị đang sử dụng</h5>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-2" />
                <div className="text-secondary">Đang tải danh sách đơn vị...</div>
              </div>
            ) : unitsList.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded border">
                Chưa có đơn vị đo lường nào.
              </div>
            ) :
              (
                <><Table hover>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>STT</th>
                      <th>Tên đơn vị</th>
                      <th>Mô tả</th>
                      <th style={{ width: "120px" }}>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {unitsList.map((unit, index) => (
                      <tr key={unit.id}>
                        <td>{index + 1}</td>

                        <td>{unit.name}</td>

                        <td>{unit.description || "-"}</td>


                        <td className="text-center">

                          <Button
                            className="system-action-btn edit-btn me-2"
                            size="sm"
                            title="Sửa"
                            onClick={() => {

                              setEditingUnit(unit);

                              setShowUpdateModal(true);
                            }}
                          >
                            <BsPencil size={14} />
                          </Button>

                          <Button
                            className="system-action-btn delete-btn"
                            size="sm"
                            title="Xóa"
                            onClick={() => {
                              setSelectedUnit(unit);
                              setShowDeleteModal(true);
                            }}
                          >
                            <BsTrash size={14} />
                          </Button>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table><PaginationPanel
                    page={page}
                    size={size}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    onPageChange={(newPage) => fetchUnits(newPage, size)}
                    onSizeChange={(newSize) => {
                      setSize(newSize);
                      fetchUnits(0, newSize);
                    }} /></>
              )}
          </div>
        </Col>
      </Row>
    </div>

      {/* Modal thêm mới */}

      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thêm đơn vị</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Form.Group className="mb-3">
            <Form.Label>Tên đơn vị</Form.Label>
            <Form.Control
              name="name"
              value={addFormik.values.name}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              isInvalid={addFormik.touched.name && addFormik.errors.name}
            />

            <Form.Control.Feedback type="invalid">
              {addFormik.errors.name}
            </Form.Control.Feedback>

          </Form.Group>
          <Form.Group>
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              name="description"
              value={addFormik.values.description}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              isInvalid={
                addFormik.touched.description &&
                addFormik.errors.description
              }
            />

            <Form.Control.Feedback type="invalid">
              {addFormik.errors.description}
            </Form.Control.Feedback>
          </Form.Group>

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() => setShowAddModal(false)}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={addFormik.handleSubmit}
          >
            Thêm
          </Button>

        </Modal.Footer>

      </Modal></>


      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Xóa đơn vị
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>

          Bạn có chắc chắn muốn xóa đơn vị

          <strong> {selectedUnit?.name}</strong> ?

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Hủy
          </Button>

          <Button
            variant="danger"
            onClick={async () => {

              await handleDeleteUnit(selectedUnit);

              setShowDeleteModal(false);

            }}
          >
            Xóa
          </Button>

        </Modal.Footer>

      </Modal></><Modal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật đơn vị</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Form.Group className="mb-3">

            <Form.Label>Tên đơn vị</Form.Label>

            <Form.Control
              name="name"
              value={updateFormik.values.name}
              onChange={updateFormik.handleChange}
              onBlur={updateFormik.handleBlur}
              isInvalid={
                updateFormik.touched.name &&
                !!updateFormik.errors.name
              }
            />

            <Form.Control.Feedback type="invalid">
              {updateFormik.errors.name}
            </Form.Control.Feedback>

          </Form.Group>

          <Form.Group>

            <Form.Label>Mô tả</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={updateFormik.values.description}
              onChange={updateFormik.handleChange}
              onBlur={updateFormik.handleBlur}
              isInvalid={
                updateFormik.touched.description &&
                !!updateFormik.errors.description
              }
            />

            <Form.Control.Feedback type="invalid">
              {updateFormik.errors.description}
            </Form.Control.Feedback>

          </Form.Group>

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() => {

              updateFormik.resetForm();

              setShowUpdateModal(false);

              setEditingUnit(null);

            }}
          >
            Hủy
          </Button>

          <Button
            variant="warning"
            onClick={updateFormik.handleSubmit}
          >
            Cập nhật
          </Button>

        </Modal.Footer>

      </Modal></>

  );

}
