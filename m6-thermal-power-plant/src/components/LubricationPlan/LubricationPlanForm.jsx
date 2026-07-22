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

    systemId: Yup.string().required(
        "Vui lòng chọn hệ thống"
    ),

    cycleMonths: Yup.number()
        .required("Chu kỳ bảo dưỡng không được để trống")
        .min(1, "Chu kỳ phải lớn hơn 0"),

    nextDueDate: Yup.string()
        .required("Vui lòng chọn ngày bảo dưỡng"),

    lubricantType: Yup.string()
        .required("Loại dầu mỡ không được để trống"),

    consumableId: Yup.string()
        .required("Vui lòng chọn vật tư dầu mỡ"),

    quantity: Yup.number()
        .required("Số lượng không được để trống")
        .min(0.01, "Số lượng phải lớn hơn 0"),
});

const INITIAL_VALUES = {
    sparePartCode: "PXVT-2026-001",

    technicalAssessmentId: "1",

    systemId: "",

    workOrderId: "1",

    transactionType: "export",

    issuedBy: "",

    issuedAt: "",

    items: [
        {
            sparePartId: "",
            quantity: 1,
            unit: "Cái",
        },
    ],
};

export default function LubricationPlanForm({
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
        { setSubmitting, resetForm }
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

            quantity:
                initialData.quantity || "",
        }
        : INITIAL_VALUES;

    return (
        <div className="employee-form-card nhansu-form-card">

            {/* HEADER */}
            <div className="employee-form-header nhansu-form-header">
                <div className="employee-form-header-icon nhansu-form-header-icon">
                    <BsDropletFill />
                </div>

                <div className="employee-form-header-text nhansu-form-header-text">
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
            >
                {({
                      touched,
                      errors,
                      isSubmitting,
                      resetForm,
                  }) => (
                    <Form noValidate>

                        <div className="employee-form-body nhansu-form-body">


                            {/* THIẾT BỊ */}
                            <div className="form-section-title">
                                <BsGearFill />
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
                                <BsTools />
                                Thông tin bảo dưỡng
                            </div>

                            <Row className="mb-3">

                                <Col md={4}>
                                    <label className="form-label">
                                        Chu kỳ (tháng)
                                        <span className="required-asterisk">*</span>
                                    </label>

                                    <Field
                                        name="cycleMonths"
                                        type="number"
                                        className={`form-control ${
                                            touched.cycleMonths &&
                                            errors.cycleMonths
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                    />

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

                                <Col md={4}>
                                    <label className="form-label">
                                        Số lượng
                                        <span className="required-asterisk">*</span>
                                    </label>

                                    <Field
                                        name="quantity"
                                        type="number"
                                        step="0.01"
                                        className={`form-control ${
                                            touched.quantity &&
                                            errors.quantity
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                    />

                                    <ErrorMessage
                                        name="quantity"
                                        component="div"
                                        className="invalid-feedback"
                                    />
                                </Col>

                            </Row>

                            {/* DẦU MỠ */}
                            <div className="form-section-title">
                                <BsDropletFill />
                                Dầu mỡ sử dụng
                            </div>

                            <Row>

                                <Col md={6}>
                                    <label className="form-label">
                                        Vật tư dầu mỡ
                                        <span className="required-asterisk">*</span>
                                    </label>

                                    <Field
                                        as="select"
                                        name="consumableId"
                                        className={`form-select ${
                                            touched.consumableId &&
                                            errors.consumableId
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                    >
                                        <option value="">
                                            -- Chọn vật tư --
                                        </option>

                                        {consumableList.map(
                                            (item) => (
                                                <option
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {item.name}
                                                </option>
                                            )
                                        )}
                                    </Field>

                                    <ErrorMessage
                                        name="consumableId"
                                        component="div"
                                        className="invalid-feedback"
                                    />
                                </Col>

                            </Row>

                        </div>

                        {/* FOOTER */}
                        <div className="employee-form-footer nhansu-form-footer">

                            <Button
                                variant="outline-secondary"
                                type="button"
                                onClick={() => resetForm()}
                            >
                                <BsArrowClockwise />
                                Đặt lại
                            </Button>
                            <Button as={Link} to="/lubrication/plant" variant="outline-danger">
                                <BsXCircle />
                                Huỷ bỏ
                            </Button>

                            {onCancel && (
                                <Button
                                    variant="outline-danger"
                                    type="button"
                                    onClick={onCancel}
                                >
                                    <BsXCircle />
                                    Huỷ bỏ
                                </Button>
                            )}

                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                <BsSave />
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