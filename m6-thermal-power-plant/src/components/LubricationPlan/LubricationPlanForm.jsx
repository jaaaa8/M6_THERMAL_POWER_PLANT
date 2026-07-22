import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";

import {
    BsGearFill,
    BsTools,
    BsDropletFill,
    BsSave,
    BsArrowClockwise,
    BsXCircle,
} from "react-icons/bs";

import "./LubricationPlanForm.css";
import {Link} from "react-router-dom";


const validationSchema = Yup.object({
    equipmentId: Yup.string()
        .required("Vui lòng chọn thiết bị"),

    systemId: Yup.string()
        .required("Vui lòng chọn hệ thống"),

    cycleMonths: Yup.string()
        .required("Vui lòng chọn chu kỳ"),

    nextDueDate: Yup.string()
        .required("Vui lòng chọn ngày bảo dưỡng"),

    consumableId: Yup.string()
        .required("Vui lòng chọn vật tư"),

    quantity: Yup.number()
        .required("Vui lòng nhập số lượng")
        .min(1, "Số lượng phải lớn hơn 0"),
});

const INITIAL_VALUES = {
    systemId: "",
    equipmentId: "",
    cycleMonths: "",
    nextDueDate: "",
    consumableId: "",
    quantity: 1,
};

export function LubricationPlanForm({
                                        onSuccess,
                                        onCancel,
                                        initialData = null,
                                        isEdit = false,
                                    }) {
    const [equipmentList, setEquipmentList] = useState([]);
    const [consumableList, setConsumableList] = useState([]);

    const systems = [
        {
            id: 1,
            code: "SYS-001",
            name: "Hệ thống làm mát",
        },
        {
            id: 2,
            code: "SYS-002",
            name: "Hệ thống turbine",
        },
        {
            id: 3,
            code: "SYS-003",
            name: "Hệ thống nghiền than",
        },
    ];

    useEffect(() => {
        // Demo dữ liệu cứng
        setEquipmentList([
            {
                id: 1,
                equipmentCode: "TB-001",
                equipmentName: "Bơm nước làm mát",
            },
            {
                id: 2,
                equipmentCode: "TB-002",
                equipmentName: "Turbine số 1",
            },
            {
                id: 3,
                equipmentCode: "TB-003",
                equipmentName: "Máy nghiền than",
            },
        ]);

        setConsumableList([
            {
                id: 1,
                name: "Dầu Shell Omala S2"
            },
            {
                id: 2,
                name: "Mỡ SKF LGMT 2"
            },
            {
                id: 3,
                name: "Dầu Mobil DTE 25"
            },
        ]);
    }, []);

    const handleSubmit = async (
        values,
        {setSubmitting, resetForm}
    ) => {
        try {
            console.log(values);

            toast.success(
                isEdit
                    ? "Cập nhật kế hoạch bảo dưỡng thành công"
                    : "Thêm mới kế hoạch bảo dưỡng thành công"
            );

            resetForm();
            onSuccess?.();
        } catch {
            toast.error(
                "Có lỗi xảy ra khi lưu dữ liệu"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const mergedInitialValues = initialData
        ? {
            equipmentId:
                initialData.equipmentId?.toString() || "",

            cycleMonths:
                initialData.cycleMonths || "",

            nextDueDate:
                initialData.nextDueDate || "",

            lubricantType:
                initialData.lubricantType || "",

            consumableId:
                initialData.consumableId?.toString() || "",

        }
        : INITIAL_VALUES;

    return (
        <div className="nhansu-form-card">

            {/* HEADER */}
            <div className="nhansu-form-header">
                <div className="nhansu-form-header-icon">
                    <BsDropletFill/>
                </div>

                <div className="nhansu-form-header-text">
                    <h2>
                        {isEdit
                            ? "Cập nhật Kế hoạch Bảo Dưỡng"
                            : "Thêm mới Kế hoạch Bảo Dưỡng"}
                    </h2>

                    <p>
                        Quản lý lịch bảo dưỡng
                        cho thiết bị trong nhà máy.
                    </p>
                </div>
            </div>

            <Formik
                initialValues={mergedInitialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >{({
                   values,
                   touched,
                   errors,
                   isSubmitting,
                   resetForm,
                   setFieldValue,
               }) => (
                <Form noValidate>

                    <div className="nhansu-form-body">


                        {/* THIẾT BỊ */}
                        <div className="form-section-title">
                            <BsGearFill/>
                            Thông tin thiết bị
                        </div>

                        <Row className="mb-3">

                            <Col md={6}>
                                <label className="form-label">
                                    Hệ thống
                                </label>
                                <span className="required-asterisk">*</span>

                                <Field
                                    as="select"
                                    name="systemId"
                                    className={`form-select ${
                                        touched.systemId &&
                                        errors.systemId
                                            ? "is-invalid"
                                            : ""
                                    }`}
                                >
                                    <option value="">
                                        Chọn hệ thống
                                    </option>

                                    {systems.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.code} - {item.name}
                                        </option>
                                    ))}
                                </Field>

                                <ErrorMessage
                                    name="systemId"
                                    component="div"
                                    className="invalid-feedback"
                                />
                            </Col>
                            <Col md={6}>
                                <label className="form-label">
                                    Thiết bị
                                    <span className="required-asterisk">*</span>
                                </label>

                                <Field
                                    as="select"
                                    name="equipmentId"
                                    className={`form-select ${
                                        touched.equipmentId &&
                                        errors.equipmentId
                                            ? "is-invalid"
                                            : ""
                                    }`}
                                >
                                    <option value="">
                                        -- Chọn thiết bị --
                                    </option>

                                    {equipmentList.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.equipmentCode}
                                            {" - "}
                                            {item.equipmentName}
                                        </option>
                                    ))}
                                </Field>

                                <ErrorMessage
                                    name="equipmentId"
                                    component="div"
                                    className="invalid-feedback"
                                />
                            </Col>

                        </Row>

                        {/* BẢO DƯỠNG */}
                        <div className="form-section-title">
                            <BsTools/>
                            Thông tin bảo dưỡng
                        </div>

                        <Row className="mb-3">

                            <Col md={4}>
                                <label className="form-label">
                                    Chu kỳ bảo dưỡng
                                    <span className="required-asterisk">*</span>
                                </label>

                                <Field
                                    as="select"
                                    name="cycleMonths"
                                    className={`form-select ${
                                        touched.cycleMonths &&
                                        errors.cycleMonths
                                            ? "is-invalid"
                                            : ""
                                    }`}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setFieldValue("cycleMonths", value);

                                        if (!value) {
                                            setFieldValue(
                                                "nextDueDate",
                                                ""
                                            );
                                            return;
                                        }

                                        const nextDate = new Date();

                                        nextDate.setDate(
                                            nextDate.getDate() +
                                            Number(value)
                                        );

                                        setFieldValue(
                                            "nextDueDate",
                                            nextDate
                                                .toISOString()
                                                .split("T")[0]
                                        );
                                    }}
                                >
                                    <option value="">
                                        Chọn chu kỳ
                                    </option>

                                    <option value="7">
                                        1 tuần
                                    </option>

                                    <option value="30">
                                        1 tháng
                                    </option>

                                    <option value="90">
                                        3 tháng
                                    </option>

                                    <option value="180">
                                        6 tháng
                                    </option>
                                </Field>

                                <ErrorMessage
                                    name="cycleMonths"
                                    component="div"
                                    className="invalid-feedback"
                                />
                            </Col>

                            <Col md={4}>
                                <label className="form-label">
                                    Ngày bảo dưỡng tiếp theo
                                    <span className="required-asterisk">*</span>
                                </label>

                                <Field
                                    name="nextDueDate"
                                    type="date"
                                    readOnly
                                    className={`form-control ${
                                        touched.nextDueDate &&
                                        errors.nextDueDate
                                            ? "is-invalid"
                                            : ""
                                    }`}
                                />

                                <ErrorMessage
                                    name="nextDueDate"
                                    component="div"
                                    className="invalid-feedback"
                                />
                            </Col>

                        </Row>

                        {/* DẦU MỠ */}
                        <div className="form-section-title">
                            <BsDropletFill/>
                            Dầu mỡ sử dụng
                        </div>

                        <Row>

                            <Col md={12}>

                                <label className="form-label">
                                    Vật tư dầu mỡ
                                    <span className="required-asterisk">*</span>
                                </label>

                                <div className="table-responsive">

                                    <table className="table table-hover table-bordered align-middle">

                                        <thead className="table-primary">

                                        <tr>

                                            <th width="70">
                                                Chọn
                                            </th>

                                            <th width="100">
                                                Ảnh
                                            </th>

                                            <th width="180">
                                                Mã vật tư
                                            </th>

                                            <th>
                                                Tên vật tư
                                            </th>

                                            <th width="140">
                                                Đơn vị
                                            </th>

                                            <th width="160">
                                                Trạng thái
                                            </th>

                                            <th width="140">
                                                Số lượng
                                            </th>

                                        </tr>

                                        </thead>

                                        <tbody>

                                        {consumableList.length === 0 ? (

                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="text-center"
                                                >
                                                    Không có dữ liệu
                                                </td>
                                            </tr>

                                        ) : (

                                            consumableList.map(item => {

                                                const selected =
                                                    values.consumableId?.toString() ===
                                                    item.id.toString();

                                                return (

                                                    <tr
                                                        key={item.id}
                                                        className={
                                                            selected
                                                                ? "table-info"
                                                                : ""
                                                        }
                                                    >

                                                        <td className="text-center">

                                                            <input
                                                                type="radio"
                                                                name="selectedConsumable"
                                                                checked={
                                                                    selected
                                                                }
                                                                onChange={() =>
                                                                    setFieldValue(
                                                                        "consumableId",
                                                                        item.id
                                                                    )
                                                                }
                                                            />

                                                        </td>

                                                        <td className="text-center">

                                                            <img
                                                                src={
                                                                    item.imgPath ||
                                                                    "/images/no-image.png"
                                                                }
                                                                alt={
                                                                    item.name
                                                                }
                                                                style={{
                                                                    width: "60px",
                                                                    height: "60px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "8px",
                                                                    border:
                                                                        "1px solid #dee2e6"
                                                                }}
                                                            />

                                                        </td>

                                                        <td>
                                                            {
                                                                item.consumableCode
                                                            }
                                                        </td>

                                                        <td>
                                                            {item.name}
                                                        </td>

                                                        <td>

                                    <span className="badge bg-info">

                                        {
                                            item.unit?.unitName ||
                                            item.unitName ||
                                            item.unit ||
                                            "-"
                                        }

                                    </span>

                                                        </td>

                                                        <td>
    <span
        className={`badge ${
            item.status === "ACTIVE"
                ? "bg-success"
                : "bg-secondary"
        }`}
    >
        {
            item.status === "ACTIVE"
                ? "Đang sử dụng"
                : "Ngừng sử dụng"
        }
    </span>
                                                        </td>

                                                        <td>
                                                            {selected && (
                                                                <Field
                                                                    type="number"
                                                                    min="1"
                                                                    name="quantity"
                                                                    className="form-control"
                                                                    placeholder="SL"
                                                                />
                                                            )}
                                                        </td>

                                                    </tr>
                                                );
                                            })

                                        )}

                                        </tbody>

                                    </table>

                                </div>

                                <ErrorMessage
                                    name="consumableId"
                                    component="div"
                                    className="text-danger mt-2"
                                />

                            </Col>

                        </Row>

                    </div>

                    {/* FOOTER */}
                    <div className="nhansu-form-footer">

                        <Button
                            variant="outline-secondary"
                            type="button"
                            onClick={() => resetForm()}
                        >
                            <BsArrowClockwise/>
                            Đặt lại
                        </Button>
                        <Link to="/lubrication/plant">
                            <Button variant="outline-danger">
                                <BsXCircle/>
                                Huỷ bỏ
                            </Button>
                        </Link>

                        {onCancel && (
                            <Button
                                variant="outline-danger"
                                type="button"
                                onClick={onCancel}
                            >
                                <BsXCircle/>
                                Huỷ bỏ
                            </Button>
                        )}

                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            <BsSave/>
                            {isEdit
                                ? "Cập nhật"
                                : "Thêm mới"}
                        </Button>

                    </div>

                </Form>
            )}
            </Formik>
        </div>
    );
}