import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import lubricationPlanService from "../../services/lubricationPlanService";
import * as systemService from "../../services/equipment/systemService";
import * as equipmentService from "../../services/equipment/equipmentService.js";
import * as consumableService from "../../services/consumableService";

import {
    BsGearFill,
    BsTools,
    BsDropletFill,
    BsSave,
    BsArrowClockwise,
    BsXCircle,
} from "react-icons/bs";

import "./LubricationPlanForm.css";
import {Link, useNavigate } from "react-router-dom";


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

    status: "NOT_LUBRICATED"

};

export function LubricationPlanForm({
                                        onSuccess,
                                        onCancel,
                                        initialData = null,
                                        isEdit = false,
                                    }) {
    const [systemList, setSystemList] = useState([]);

    const [equipmentList, setEquipmentList] = useState([]);

    const [consumableList, setConsumableList] = useState([]);

    const [loadingEquipment, setLoadingEquipment] = useState(false);

    const [loadingConsumable, setLoadingConsumable] = useState(false);
    const navigate = useNavigate();

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

        loadSystems();

    }, []);



    const loadSystems = async () => {

        try {

            const res =
                await systemService.getAllSystems(
                    "",
                    "ACTIVE",
                    0,
                    100
                );


            setSystemList(
                res.data.content || res.data || []
            );


        } catch(error){

            console.error(
                "Lỗi load hệ thống:",
                error
            );

            toast.error(
                "Không tải được danh sách hệ thống"
            );

        }

    };

    const loadEquipmentBySystem = async (
        systemId,
        setFieldValue
    ) => {

        try {

            setLoadingEquipment(true);


            setEquipmentList([]);

            setConsumableList([]);


            setFieldValue(
                "equipmentId",
                ""
            );

            setFieldValue(
                "consumableId",
                ""
            );


            const res =
                await equipmentService.getBySystem(
                    systemId
                );


            setEquipmentList(
                res.data.content ||
                res.data ||
                []
            );


        } catch(error){

            console.error(
                error
            );

            toast.error(
                "Không tải được thiết bị"
            );


        } finally {

            setLoadingEquipment(false);

        }

    };

    const loadConsumableByKks = async (
        kksCode
    ) => {

        try {

            setLoadingConsumable(true);


            setConsumableList([]);


            const res =
                await consumableService.search({

                    keyword: kksCode,

                    status:"ACTIVE",

                    page:0,

                    size:50

                });


            setConsumableList(
                res.data.content ||
                res.data ||
                []
            );


        } catch(error){

            console.error(error);

            toast.error(
                "Không tìm thấy vật tư"
            );


        } finally {

            setLoadingConsumable(false);

        }

    };

    const handleSubmit = async (
        values,
        { setSubmitting, resetForm }
    ) => {
        try {

            const payload = {
                lubricationCode: `LP-${Date.now()}`,

                equipment: {
                    id: Number(values.equipmentId)
                },

                cycleDays: Number(values.cycleMonths),

                nextDueDate: values.nextDueDate,

                status: "NOT_LUBRICATED",

                consumable: {
                    id: Number(values.consumableId)
                },

                quantity: Number(values.quantity)
            };

            const response =
                await lubricationPlanService.create(payload);

            toast.success(
                isEdit
                    ? "Cập nhật kế hoạch bảo dưỡng thành công"
                    : "Thêm mới kế hoạch bảo dưỡng thành công"
            );

            onSuccess?.(response);

            setTimeout(() => {
                navigate("/lubrication/plant");
            }, 1000);

        } catch (error) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Có lỗi xảy ra khi lưu dữ liệu"
            );

        } finally {

            setSubmitting(false);

        }
    };

    const mergedInitialValues = initialData
        ? {

            systemId:
                initialData.equipment?.system?.id || "",


            equipmentId:
                initialData.equipment?.id?.toString() || "",


            cycleMonths:
                initialData.cycleDays || "",


            nextDueDate:
                initialData.nextDueDate || "",


            consumableId:
                initialData.consumable?.id?.toString() || "",


            quantity:
                initialData.quantity || 1

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
                                    className="form-select"

                                    onChange={(e)=>{

                                        const systemId =
                                            e.target.value;


                                        setFieldValue(
                                            "systemId",
                                            systemId
                                        );


                                        if(systemId){

                                            loadEquipmentBySystem(
                                                systemId,
                                                setFieldValue
                                            );

                                        }

                                    }}
                                >
                                    <option value="">
                                        Chọn hệ thống
                                    </option>

                                    {systemList.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.code}
                                            {" - "}
                                            {item.name}
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

                                    className="form-select"


                                    onChange={(e)=>{


                                        const equipmentId =
                                            e.target.value;


                                        setFieldValue(
                                            "equipmentId",
                                            equipmentId
                                        );


                                        const equipment =
                                            equipmentList.find(
                                                x =>
                                                    x.id === Number(equipmentId)
                                            );


                                        if(
                                            equipment &&
                                            equipment.kksCode
                                        ){

                                            loadConsumableByKks(
                                                equipment.kksCode
                                            );

                                        }


                                    }}

                                >
                                    <option value="">
                                        {
                                            loadingEquipment
                                                ? "Đang tải thiết bị..."
                                                : "-- Chọn thiết bị --"
                                        }
                                    </option>

                                    {equipmentList.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.kksCode}
                                            {" - "}
                                            {item.name}
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
                        <div className="card shadow-sm border-0">

                            <div className="card-header bg-info text-white d-flex align-items-center">

                                <BsDropletFill className="me-2"/>

                                <span>Danh sách dầu mỡ sử dụng</span>

                                <span className="ms-auto badge bg-light text-dark">
            {consumableList.length} vật tư
        </span>

                            </div>

                            <div className="card-body p-0">
                                {/* table */}
                            </div>

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

                                            <th width="160">
                                                Số lượng
                                            </th>

                                        </tr>

                                        </thead>

                                        <tbody>

                                        {loadingConsumable  ? (

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
                                                                ? "table-primary fw-bold"
                                                                : ""
                                                        }
                                                        style={
                                                            selected
                                                                ? {
                                                                    borderLeft:
                                                                        "4px solid #0d6efd"
                                                                }
                                                                : {}
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
                                                            {selected && values.consumableId && (

                                                                <Field
                                                                    type="number"
                                                                    min="1"
                                                                    name="quantity"
                                                                    className="form-control"
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
                    <div
                        className="nhansu-form-footer d-flex justify-content-end gap-2 border-top pt-3"
                    >

                        <Link to="/lubrication/plant">
                            <Button
                                variant="outline-danger"
                                type="button"
                            >
                                <BsXCircle className="me-1"/>
                                Huỷ bỏ
                            </Button>
                        </Link>

                        <Button
                            variant="outline-secondary"
                            type="button"
                            onClick={() => resetForm()}
                        >
                            <BsArrowClockwise className="me-1"/>
                            Đặt lại
                        </Button>

                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            <BsSave className="me-1"/>
                            {isEdit ? "Cập nhật" : "Lưu kế hoạch"}
                        </Button>

                    </div>

                </Form>
            )}
            </Formik>
        </div>
    );
}