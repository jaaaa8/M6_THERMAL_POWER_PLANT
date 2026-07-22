import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Spinner, Table, Modal } from 'react-bootstrap';
import {
    BsPlusLg,
    BsArrowLeft,
    BsTrash,
    BsPencil
} from "react-icons/bs";
import { Dropdown } from "react-bootstrap";
import * as unitService from "../../services/equipment/unitService";
import * as catalogService from "../../services/equipment/catalogService";
import { toast } from 'react-toastify';
import './style/ListEquipment.css';
import PaginationPanel from "./PaginationPanel";
import { useFormik } from "formik";
import * as Yup from "yup";


export default function ManageUnits() {
    const navigate = useNavigate();
    const [catalogList, setCatalogList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [unitsList, setUnitsList] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [selectedCatalog, setSelectedCatalog] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    const [editingCatalog, setEditingCatalog] = useState(null);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const catalogSchema = Yup.object({
        name: Yup.string()
            .trim()
            .required("Tên thông số không được để trống")
            .max(100, "Tên thông số tối đa 100 ký tự")
            .matches(
                /^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ].*$/,
                "Tên thông số phải bắt đầu bằng chữ cái viết hoa"
            )
            // Chỉ cho phép chữ, số, khoảng trắng
            .matches(
                /^[A-Za-zÀ-ỹ0-9\s]+$/,
                "Tên thông số chỉ được chứa chữ cái, số và khoảng trắng"
            ),

        description: Yup.string()
            .max(255, "Mô tả tối đa 255 ký tự"),
        units: Yup.array()
            .min(1, "Phải chọn ít nhất một đơn vị")
    });
    // Fetch units list

    const fetchUnits = async () => {
        try {
            const res = await unitService.getAll(0, 1000);
            setUnitsList(res.data.content);
        } catch (e) {
            toast.error("Không thể tải danh sách đơn vị");
        }
    };
    const fetchCatalogs = async (pageNumber = page, pageSize = size) => {
        setLoading(true);
        try {
            const res = await catalogService.getAll(pageNumber, pageSize);
            setCatalogList(res.data.content);
            setPage(res.data.number);
            setSize(res.data.size);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);

        } catch (e) {
            toast.error("Không thể tải danh mục thông số");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCatalogs(0, size);
        fetchUnits();
    }, []);

    // Add unit handler
    const addFormik = useFormik({
        initialValues: {
            name: "",
            description: "",
            units: []
        },

        validationSchema: catalogSchema,

        onSubmit: async (values, { resetForm }) => {
            try {

                await catalogService.create(values);

                toast.success("Thêm thành công");

                setShowAddModal(false);

                resetForm();

                fetchCatalogs();

            } catch (e) {

                console.log(e);

                toast.error("Thêm thất bại");
            }
        }
    });
    // Delete unit handler
    const handleDeleteCatalog = async (catalog) => {
        try {
            await catalogService.remove(catalog.id);

            await fetchCatalogs();

            toast.success("Xóa thông số thành công");
        } catch (e) {
            console.error(e);
            toast.error("Lỗi xóa thông số");
        }
    };

    // Update Unit
    const updateFormik = useFormik({
        enableReinitialize: true,

        initialValues: {
            name: editingCatalog?.name || "",
            description: editingCatalog?.description || "",
            units: editingCatalog?.units || []
        },

        validationSchema: catalogSchema,

        onSubmit: async (values, { resetForm }) => {

            try {

                await catalogService.update(editingCatalog.id, values);

                toast.success("Cập nhật thành công");

                setShowUpdateModal(false);

                setEditingCatalog(null);

                resetForm();

                fetchCatalogs();

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
                            Thêm thông số
                        </Button>
                    </div>

                    <div className="surface-card p-4 border rounded-lg bg-white">
                        <h5 className="fw-bold mb-3">Thông số đang sử dụng</h5>
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" className="mb-2" />
                                <div className="text-secondary">Đang tải danh sách thông số...</div>
                            </div>
                        ) : catalogList.length === 0 ? (
                            <div className="text-center py-5 text-muted bg-light rounded border">
                                Chưa có thông số nào.
                            </div>
                        ) :
                            (
                                <><Table hover>
                                    <thead>
                                        <tr>
                                            <th style={{ width: "80px" }}>STT</th>
                                            <th>Tên thông số</th>
                                            <th>Đơn vị áp dụng</th>
                                            <th>Mô tả</th>
                                            <th style={{ width: "120px" }}>Thao tác</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {catalogList.map((catalog, index) => (
                                            <tr key={catalog.id}>
                                                <td>{page * size + index + 1}</td>

                                                <td>{catalog.name}</td>

                                                <td>

                                                    {catalog.units?.length
                                                        ? catalog.units.map(unit => unit.name).join(", ")
                                                        : "-"}
                                                </td>

                                                <td>{catalog.description || "-"}</td>

                                                <td className="text-center">

                                                    <Button
                                                        className="system-action-btn edit-btn me-2"
                                                        size="sm"
                                                        title="Sửa"
                                                        onClick={() => {

                                                            setEditingCatalog(catalog);

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
                                                            setSelectedCatalog(catalog);
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
                                        onPageChange={(newPage) => fetchCatalogs(newPage, size)}
                                        onSizeChange={(newSize) => {
                                            setSize(newSize);
                                            fetchCatalogs(0, newSize);
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
                    <Modal.Title>Thêm thông số</Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    <Form.Group className="mb-3">
                        <Form.Label>Tên thông số</Form.Label>
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
                    <Form.Group className="mb-3">
                        <Form.Label>Đơn vị áp dụng</Form.Label>

                        <Dropdown autoClose="outside">
                            <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start">
                                {addFormik.values.units.length > 0
                                    ? addFormik.values.units.map(u => u.name).join(", ")
                                    : "Chọn đơn vị"}
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="w-100 p-2">
                                {unitsList.map(unit => (
                                    <Form.Check
                                        key={unit.id}
                                        type="checkbox"
                                        id={`unit-${unit.id}`}
                                        label={unit.name}
                                        checked={addFormik.values.units.some(u => u.id === unit.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                addFormik.setFieldValue("units", [
                                                    ...addFormik.values.units,
                                                    unit
                                                ]);
                                            } else {
                                                addFormik.setFieldValue(
                                                    "units",
                                                    addFormik.values.units.filter(u => u.id !== unit.id)
                                                );
                                            }
                                        }}
                                        className="mb-2"
                                    />
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>

                        {addFormik.touched.units && addFormik.errors.units && (
                            <div className="text-danger mt-1">
                                {addFormik.errors.units}
                            </div>
                        )}
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



            {/* Modal Xóa */}
            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Xóa thông số kỹ thuật
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    Bạn có chắc chắn muốn xóa thông số kỹ thuật

                    <strong> {selectedCatalog?.name}</strong> ?

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

                            await handleDeleteCatalog(selectedCatalog);

                            setShowDeleteModal(false);

                        }}
                    >
                        Xóa
                    </Button>

                </Modal.Footer>

                {/* Modal chỉnh sửa */}

            </Modal></><Modal
                show={showUpdateModal}
                onHide={() => setShowUpdateModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật thông số kỹ thuật</Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    <Form.Group className="mb-3">

                        <Form.Label>Tên thông số kỹ thuật</Form.Label>

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
                    <Form.Group className="mb-3">
                        <Form.Label>Đơn vị áp dụng</Form.Label>

                        <Dropdown autoClose="outside">
                            <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start">
                                {addFormik.values.units.length > 0
                                    ? addFormik.values.units.map(u => u.name).join(", ")
                                    : "Chọn đơn vị"}
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="w-100 p-2">
                                {unitsList.map(unit => (
                                    <Form.Check
                                        key={unit.id}
                                        type="checkbox"
                                        id={`unit-${unit.id}`}
                                        label={unit.name}
                                        checked={updateFormik.values.units.some(u => u.id === unit.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                updateFormik.setFieldValue("units", [
                                                    ...updateFormik.values.units,
                                                    unit
                                                ]);
                                            } else {
                                                updateFormik.setFieldValue(
                                                    "units",
                                                    updateFormik.values.units.filter(u => u.id !== unit.id)
                                                );
                                            }
                                        }}
                                        className="mb-2"
                                    />
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>

                        {updateFormik.touched.units && updateFormik.errors.units && (
                            <div className="text-danger mt-1">
                                {updateFormik.errors.units}
                            </div>
                        )}
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

                            setEditingCatalog(null);

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
