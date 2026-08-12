import { useEffect, useState } from "react";
import { Button, Table, Form } from "react-bootstrap";
import AddCatalogModal from "./AddCatalogModal";
import {
    BsPlusLg,
    BsPlus,
    BsTrash,
    BsPencil
} from "react-icons/bs";
import { toast } from "react-toastify";

import * as parameterService from "../../services/equipment/parameterService";
import * as catalogService from "../../services/equipment/catalogService";
import { authService } from "../../services/authService";
import { hasAnyRole } from "../../services/roleService";

const WRITE_ROLES = ['WORKSHOP_FOREMAN'];

export default function TechnicalParameterTab({
    equipmentId,
    technicalParameters,
    onReload
}) {

    const canWrite = hasAnyRole(authService.getCurrentUser(), WRITE_ROLES);

    const [mode, setMode] = useState("create");
    const [editing, setEditing] = useState(false);
    const [tempParams, setTempParams] = useState([]);

    const [catalogs, setCatalogs] = useState([]);
    const [errors, setErrors] = useState({});
    const loadCatalog = async () => {
        const res = await catalogService.getAll(0, 1000);

        setCatalogs(res.data.content);
    };

    useEffect(() => {

        loadCatalog();

    }, []);

    const [showCatalogModal, setShowCatalogModal] = useState(false);
    const openCreate = () => {
        setTempParams([
            {
                tempId: 1,
                id: null,
                parameterId: "",
                name: "",
                value: "",
                description: "",
                units: [],
                unitId: ""
            }
        ]);

        setMode("create");
        setEditing(true);
    };

    const openEditor = (param) => {

        const catalog = catalogs.find(
            c => c.id === param.parameterId
        );

        setTempParams([
            {
                ...param,
                tempId: 1,
                units: catalog?.units || [],
                unitId: param.unitId
            }
        ]);

        setMode("edit");
        setEditing(true);
    };
    const addRow = () => {

        const nextId =
            tempParams.length === 0
                ? 1
                : Math.max(...tempParams.map(x => x.tempId)) + 1;

        setTempParams(prev => [
            ...prev,
            {
                tempId: nextId,
                id: null,
                parameterId: "",
                name: "",
                value: "",
                description: "",
                units: [],
                unitId: ""
            }
        ]);
    };

    const updateField = (tempId, key, value) => {

        setTempParams(prev =>
            prev.map(item =>
                item.tempId === tempId
                    ? { ...item, [key]: value }
                    : item
            )
        );

        setErrors(prev => ({
            ...prev,
            [tempId]: {
                ...prev[tempId],
                [key]: undefined
            }
        }));
    };

    const deleteRow = async (param) => {

        if (param.id) {

            await parameterService.remove(param.id);

        }

        setTempParams(prev =>

            prev.filter(x => x.tempId !== param.tempId)

        );

    };

    const save = async () => {
        if (!validateRows()) {
            return;
        }
        try {

            const createList = tempParams
                .filter(p => !p.id)
                .map(p => ({
                    equipmentId: Number(equipmentId),
                    parameterId: Number(p.parameterId),
                    unitId: Number(p.unitId),
                    value: p.value,
                    description: p.description || ""
                }));

            const updateList = tempParams.filter(p => p.id);

            // update từng bản ghi
            for (const p of updateList) {
                await parameterService.update(p.id, {
                    equipmentId: Number(equipmentId),
                    parameterId: Number(p.parameterId),
                    unitId: Number(p.unitId),
                    value: p.value,
                    description: p.description || ""
                });
            }

            // tạo mới nhiều bản ghi cùng lúc
            if (createList.length > 0) {
                await parameterService.create(createList);
            }

            toast.success("Lưu thành công");
            setEditing(false);
            onReload();

        } catch (e) {

            console.error(e);

            const message =
                e.response?.data?.message ||
                e.response?.data?.error ||
                e.response?.data ||
                "Cập nhật thất bại";

            toast.error(message);

        }

    };
    const validateRows = () => {

        const newErrors = {};

        tempParams.forEach((p) => {

            const rowError = {};

            if (!p.parameterId) {
                rowError.parameterId = "Vui lòng chọn thông số.";
            }

            if (!p.unitId) {
                rowError.unitId = "Vui lòng chọn đơn vị.";
            }

            if (!p.value?.trim()) {
                rowError.value = "Vui lòng nhập giá trị.";
            } else if (p.value.trim().length > 100) {
                rowError.value = "Giá trị tối đa 100 ký tự.";
            }

            if (p.description?.length > 255) {
                rowError.description = "Mô tả tối đa 255 ký tự.";
            }

            if (Object.keys(rowError).length > 0) {
                newErrors[p.tempId] = rowError;
            }

        });

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Vui lòng kiểm tra lại dữ liệu.");
            return false;
        }

        return true;
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">

                <h5 className="fw-bold">
                    Thông số kỹ thuật
                </h5>
                <Button onClick={openCreate} hidden={!canWrite}>

                    <BsPlusLg />

                    Thêm thông số

                </Button>

            </div>
            <AddCatalogModal
                show={showCatalogModal}
                onHide={() => setShowCatalogModal(false)}
                onSuccess={loadCatalog}
            />
            {technicalParameters?.length > 0 && (
                <Table hover>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên</th>
                            <th>Giá trị</th>
                            <th>Đơn vị</th>
                            <th>Mô tả</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {technicalParameters.map((p, index) => (
                            <tr key={p.id}>
                                <td>{index + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.value}</td>

                                <td>
                                    <div className="d-flex flex-wrap gap-1">
                                        {p.unitName}
                                    </div>
                                </td>

                                <td>{p.description}</td>

                                <td>
                                    <Button
                                        variant="link"
                                        hidden={!canWrite}
                                        onClick={() => openEditor(p)}
                                    >
                                        <BsPencil />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
            {technicalParameters?.length === 0 && (
                <div className="text-center py-5 text-muted bg-light rounded border">
                    Chưa có thông số kỹ thuật
                </div>
            )}

            {
                editing && (
                    <div className="border rounded mt-4 p-3 bg-light">

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <h5>
                                {mode === "create"
                                    ? "Thêm thông số kỹ thuật"
                                    : "Chỉnh sửa thông số kỹ thuật"}
                            </h5>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setShowCatalogModal(true)}
                            >
                                <BsPlusLg />

                            </Button>
                        </div>
                        <Table bordered>
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Tên thông số</th>
                                    <th>Giá trị</th>
                                    <th>Đơn vị</th>
                                    <th>Mô tả</th>

                                    <th></th>

                                </tr>

                            </thead>

                            <tbody>

                                {tempParams.map((p, index) => (

                                    <tr key={p.tempId}>

                                        <td>{index + 1}</td>

                                        <td style={{ width: "30%" }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <Form.Select
                                                    value={p.parameterId}
                                                    onChange={(e) => {
                                                        const catalog = catalogs.find(
                                                            c => c.id === Number(e.target.value)
                                                        );

                                                        if (!catalog) return;
                                                        updateField(p.tempId, "parameterId", catalog.id);
                                                        updateField(p.tempId, "name", catalog.name);
                                                        updateField(p.tempId, "units", catalog.units || []);

                                                        updateField(p.tempId, "unitId", "");

                                                    }}
                                                >

                                                    <option value="">
                                                        Chọn thông số
                                                    </option>

                                                    {catalogs.map(c =>

                                                        <option
                                                            key={c.id}
                                                            value={c.id}
                                                        >
                                                            {c.name}
                                                        </option>

                                                    )}

                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors[p.tempId]?.parameterId}
                                                </Form.Control.Feedback>
                                            </div>
                                        </td>

                                        <td style={{ width: "15%" }}>
                                            <div className="d-flex align-items-center gap-2">

                                                <Form.Control
                                                    value={p.value}
                                                    isInvalid={!!errors[p.tempId]?.value}
                                                    onChange={(e) =>
                                                        updateField(
                                                            p.tempId,
                                                            "value",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors[p.tempId]?.value}
                                                </Form.Control.Feedback>
                                            </div>
                                        </td>
                                        <td style={{ width: "25%" }}>
                                            <div className="d-flex align-items-center gap-2">

                                                <Form.Select
                                                    value={p.unitId}
                                                    isInvalid={!!errors[p.tempId]?.unitId}
                                                    onChange={(e) =>
                                                        updateField(
                                                            p.tempId,
                                                            "unitId",
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                >

                                                    <option value="">
                                                        Chọn đơn vị
                                                    </option>

                                                    {p.units?.map(unit => (
                                                        <option
                                                            key={unit.id}
                                                            value={unit.id}
                                                        >
                                                            {unit.name}
                                                        </option>
                                                    ))}

                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors[p.tempId]?.unitId}
                                                </Form.Control.Feedback>
                                            </div>
                                        </td>

                                        <td style={{ width: "20%" }}>
                                            <div className="d-flex align-items-center gap-2">

                                                <Form.Control
                                                    value={p.description}
                                                    isInvalid={!!errors[p.tempId]?.description}
                                                    onChange={(e) =>
                                                        updateField(
                                                            p.tempId,
                                                            "description",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors[p.tempId]?.description}
                                                </Form.Control.Feedback>
                                            </div>
                                        </td>

                                        <td style={{ width: "5%" }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <Button
                                                    variant="link"
                                                    className="text-danger"
                                                    onClick={() => deleteRow(p)}
                                                >

                                                    <BsTrash />

                                                </Button>
                                            </div>

                                        </td>
                                    </tr>

                                ))}

                            </tbody>

                        </Table>

                        <div className="d-flex justify-content-between">

                            <Button
                                variant="outline-secondary"
                                onClick={addRow}
                            >

                                <BsPlus />

                                Thêm dòng

                            </Button>

                            <div>

                                <Button
                                    variant="secondary"
                                    className="me-2"
                                    onClick={() => setEditing(false)}
                                >

                                    Hủy

                                </Button>

                                <Button
                                    onClick={save}
                                >
                                    Lưu
                                </Button>

                            </div>

                        </div>

                    </div>

                )
            }


        </>
    );

}