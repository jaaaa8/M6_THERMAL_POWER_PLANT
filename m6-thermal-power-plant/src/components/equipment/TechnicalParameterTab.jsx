import { useEffect, useState } from "react";
import { Button, Table, Form } from "react-bootstrap";
import {
    BsPlusLg,
    BsPlus,
    BsTrash,
    BsPencil
} from "react-icons/bs";

import { toast } from "react-toastify";

import * as parameterService from "../../services/equipment/parameterService";
import * as catalogService from "../../services/equipment/catalogService";
export default function TechnicalParameterTab({
    equipmentId,
    technicalParameters,
    onReload
}) {

    const [mode, setMode] = useState("create");
    const [editing, setEditing] = useState(false);
    const [tempParams, setTempParams] = useState([]);

    const [catalogs, setCatalogs] = useState([]);


    useEffect(() => {

        loadCatalog();

    }, []);

    const loadCatalog = async () => {
        const res = await catalogService.getAll(0, 1000);

        setCatalogs(res.data.content);
    };


    const openCreate = () => {
        setTempParams([
            {
                tempId: 1,
                id: null,
                parameterId: "",
                name: "",
                value: "",
                description: "",
                unit: []
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
                unit: catalog?.units || param.unit || []
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
                unit: []
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
        try {

            const createList = tempParams
                .filter(p => !p.id)
                .map(p => ({
                    equipmentId: Number(equipmentId),
                    parameterId: Number(p.parameterId),
                    value: p.value,
                    description: p.description || ""
                }));

            const updateList = tempParams.filter(p => p.id);

            // update từng bản ghi
            for (const p of updateList) {
                await parameterService.update(p.id, {
                    equipmentId: Number(equipmentId),
                    parameterId: Number(p.parameterId),
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
            toast.error("Lưu thất bại");
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">

                <h5 className="fw-bold">
                    Thông số kỹ thuật
                </h5>

                <Button onClick={openCreate}>

                    <BsPlusLg />

                    Thêm thông số

                </Button>

            </div>
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
                                        {p.unit?.map(u => (
                                            <span
                                                key={u.id}
                                                className="badge bg-info-subtle text-dark border"
                                            >
                                                {u.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>

                                <td>{p.description}</td>

                                <td>
                                    <Button
                                        variant="link"
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

                        <h5>
                            {mode === "create"
                                ? "Thêm thông số kỹ thuật"
                                : "Chỉnh sửa thông số kỹ thuật"}
                        </h5>
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

                                        <td>

                                            <Form.Select
                                                value={p.parameterId}
                                                onChange={(e) => {
                                                    const catalog = catalogs.find(
                                                        c => c.id === Number(e.target.value)
                                                    );

                                                    if (!catalog) return;
                                                    updateField(p.tempId, "parameterId", catalog.id);
                                                    updateField(p.tempId, "name", catalog.name);
                                                    updateField(p.tempId, "unit", catalog.units || []);

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

                                        </td>

                                        <td>

                                            <Form.Control
                                                value={p.value}
                                                onChange={(e) =>
                                                    updateField(
                                                        p.tempId,
                                                        "value",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                        </td>
                                        <td>
                                            {p.unit?.length > 0 ? (
                                                p.unit.map(unit => (
                                                    <span
                                                        key={unit.id}
                                                        className="badge bg-info text-dark me-1"
                                                    >
                                                        {unit.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted">
                                                    Chưa có đơn vị
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <Form.Control
                                                value={p.description}
                                                onChange={(e) =>
                                                    updateField(
                                                        p.tempId,
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </td>

                                        <td>

                                            <Button
                                                variant="link"
                                                className="text-danger"
                                                onClick={() => deleteRow(p)}
                                            >

                                                <BsTrash />

                                            </Button>

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