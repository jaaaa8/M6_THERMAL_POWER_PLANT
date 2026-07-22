import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Row, Col, Button, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
    BsGearFill,
    BsTools,
    BsDropletHalf,
    BsDropletFill,
    BsSave,
    BsArrowClockwise,
    BsXCircle,
} from "react-icons/bs";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import lubricationPlanService from "../../services/lubricationPlanService";
import * as systemService from "../../services/equipment/systemService";
import * as equipmentService from "../../services/equipment/equipmentService.js";
import * as consumableService from "../../services/consumableService";
import "./LubricationPlanForm.css";

const validationSchema = Yup.object({
    equipmentId: Yup.string().required("Vui lòng chọn thiết bị"),
    systemId: Yup.string().required("Vui lòng chọn hệ thống"),
    cycleMonths: Yup.string().required("Vui lòng chọn chu kỳ"),
    nextDueDate: Yup.string().required("Vui lòng chọn ngày bảo dưỡng"),
    consumableId: Yup.string().required("Vui lòng chọn vật tư"),
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
    status: "NOT_LUBRICATED",
};

export default function LubricationPlanForm({
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

    useEffect(() => {
        loadSystems();
    }, []);

    const loadSystems = async () => {
        try {
            const res = await systemService.getAllSystems("", "ACTIVE", 0, 100);
            setSystemList(res.data.content || res.data || []);
        } catch (error) {
            console.error("Lỗi load hệ thống:", error);
            toast.error("Không tải được danh sách hệ thống");
        }
    };

    const loadEquipmentBySystem = async (systemId, setFieldValue) => {
        try {
            setLoadingEquipment(true);
            setEquipmentList([]);
            setConsumableList([]);
            setFieldValue("equipmentId", "");
            setFieldValue("consumableId", "");

            const res = await equipmentService.getBySystem(systemId);
            setEquipmentList(res.data.content || res.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Không tải được thiết bị");
        } finally {
            setLoadingEquipment(false);
        }
    };

    const loadConsumableByKks = async (kksCode) => {
        try {
            setLoadingConsumable(true);
            setConsumableList([]);

            const res = await consumableService.search({
                keyword: kksCode,
                status: "ACTIVE",
                page: 0,
                size: 50,
            });
            setConsumableList(res.data.content || res.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Không tìm thấy vật tư");
        } finally {
            setLoadingConsumable(false);
        }
    };
    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const payload = {
                lubricationCode: `LP-${Date.now()}`,
                equipment: {
                    id: Number(values.equipmentId),
                },
                cycleDays: Number(values.cycleMonths),
                nextDueDate: values.nextDueDate,
                status: "NOT_LUBRICATED",
                consumable: {
                    id: Number(values.consumableId),
                },
                quantity: Number(values.quantity),
            };

            const response = await lubricationPlanService.create(payload);

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
              systemId: initialData.equipment?.system?.id || "",
              equipmentId: initialData.equipment?.id?.toString() || "",
              cycleMonths: initialData.cycleDays || "",
              nextDueDate: initialData.nextDueDate || "",
              consumableId: initialData.consumable?.id?.toString() || "",
              quantity: initialData.quantity || 1,
          }
        : INITIAL_VALUES;

    return (
        <div className="animate-fade-in">
            <PageHeader
                icon={<BsDropletHalf />}
                title={
                    isEdit
                        ? "Cập nhật Kế hoạch Bảo dưỡng"
                        : "Thêm mới Kế hoạch Bảo dưỡng"
                }
                subtitle="Quản lý lịch bảo dưỡng cho thiết bị trong nhà máy"
            />

            <div className="lub-form-card">
                <Formik
                    initialValues={mergedInitialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({
                        values,
                        touched,
                        errors,
                        isSubmitting,
                        resetForm,
                        setFieldValue,
                    }) => (
                        <Form noValidate>
                            {/* THIẾT BỊ */}
                            <div className="lub-form-section-title">
                                <BsGearFill />
                                Thông tin thiết bị
                            </div>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <label className="form-label">
                                        Hệ thống
                                        <span className="required-asterisk">*</span>
                                    </label>
                                    <Field
                                        as="select"
                                        name="systemId"
                                        className={`form-select ${
                                            touched.systemId && errors.systemId
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        onChange={(e) => {
                                            const systemId = e.target.value;
                                            setFieldValue("systemId", systemId);
                                            if (systemId) {
                                                loadEquipmentBySystem(
                                                    systemId,
                                                    setFieldValue
                                                );
                                            }
                                        }}
                                    >
                                        <option value="">Chọn hệ thống</option>
                                        {systemList.map((item) => (
                                            <option key={item.id} value={item.id}>
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
                                        className={`form-select ${
                                            touched.equipmentId && errors.equipmentId
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        onChange={(e) => {
                                            const equipmentId = e.target.value;
                                            setFieldValue("equipmentId", equipmentId);

                                            const equipment = equipmentList.find(
                                                (x) => x.id === Number(equipmentId)
                                            );
                                            if (equipment && equipment.kksCode) {
                                                loadConsumableByKks(equipment.kksCode);
                                            }
                                        }}
                                    >
                                        <option value="">
                                            {loadingEquipment
                                                ? "Đang tải thiết bị..."
                                                : "-- Chọn thiết bị --"}
                                        </option>
                                        {equipmentList.map((item) => (
                                            <option key={item.id} value={item.id}>
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
                            <div className="lub-form-section-title">
                                <BsTools />
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
                                            touched.cycleMonths && errors.cycleMonths
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFieldValue("cycleMonths", value);

                                            if (!value) {
                                                setFieldValue("nextDueDate", "");
                                                return;
                                            }

                                            const nextDate = new Date();
                                            nextDate.setDate(
                                                nextDate.getDate() + Number(value)
                                            );
                                            setFieldValue(
                                                "nextDueDate",
                                                nextDate.toISOString().split("T")[0]
                                            );
                                        }}
                                    >
                                        <option value="">Chọn chu kỳ</option>
                                        <option value="7">1 tuần</option>
                                        <option value="30">1 tháng</option>
                                        <option value="90">3 tháng</option>
                                        <option value="180">6 tháng</option>
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
                                            touched.nextDueDate && errors.nextDueDate
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
                            {/* VẬT TƯ DẦU MỠ */}
                            <div className="lub-form-section-title">
                                <BsDropletFill />
                                Vật tư dầu mỡ
                                <span className="lub-consumable-count">
                                    {consumableList.length} vật tư
                                </span>
                            </div>

                            {loadingConsumable ? (
                                <LoadingSpinner text="Đang tải vật tư..." />
                            ) : consumableList.length === 0 ? (
                                <EmptyState
                                    icon={<BsDropletHalf />}
                                    title="Chưa có vật tư"
                                    message="Chọn thiết bị để tải danh sách vật tư dầu mỡ phù hợp."
                                />
                            ) : (
                                <div className="data-table-scroll">
                                    <Table hover className="data-table align-middle">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 60 }} className="text-center">
                                                    Chọn
                                                </th>
                                                <th style={{ width: 90 }}>Ảnh</th>
                                                <th style={{ width: 160 }}>Mã vật tư</th>
                                                <th>Tên vật tư</th>
                                                <th style={{ width: 120 }}>Đơn vị</th>
                                                <th style={{ width: 140 }}>Trạng thái</th>
                                                <th style={{ width: 130 }}>Số lượng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consumableList.map((item) => {
                                                const selected =
                                                    values.consumableId?.toString() ===
                                                    item.id.toString();
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className={selected ? "lub-row-selected" : ""}
                                                    >
                                                        <td className="text-center">
                                                            <input
                                                                type="radio"
                                                                name="selectedConsumable"
                                                                className="lub-radio"
                                                                checked={selected}
                                                                onChange={() =>
                                                                    setFieldValue(
                                                                        "consumableId",
                                                                        item.id
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <img
                                                                src={
                                                                    item.imgPath ||
                                                                    "/images/no-image.png"
                                                                }
                                                                alt={item.name}
                                                                className="lub-consumable-img"
                                                            />
                                                        </td>
                                                        <td className="font-mono">
                                                            {item.consumableCode}
                                                        </td>
                                                        <td>{item.name}</td>
                                                        <td>
                                                            {item.unit?.unitName ||
                                                                item.unitName ||
                                                                item.unit ||
                                                                "-"}
                                                        </td>
                                                        <td>
                                                            {item.status === "ACTIVE" ? (
                                                                <StatusBadge
                                                                    status="normal"
                                                                    label="Đang sử dụng"
                                                                />
                                                            ) : (
                                                                <StatusBadge
                                                                    status="inactive"
                                                                    label="Ngừng sử dụng"
                                                                />
                                                            )}
                                                        </td>
                                                        <td>
                                                            {selected && (
                                                                <Field
                                                                    type="number"
                                                                    min="1"
                                                                    name="quantity"
                                                                    className="form-control form-control-sm lub-quantity-input"
                                                                />
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            )}

                            <ErrorMessage
                                name="consumableId"
                                component="div"
                                className="text-danger small mt-2"
                            />
                            {/* FOOTER */}
                            <div className="lub-form-footer">
                                <Button
                                    as={Link}
                                    to="/lubrication/plant"
                                    variant="outline-secondary"
                                    type="button"
                                    size="sm"
                                    onClick={() => onCancel?.()}
                                >
                                    <BsXCircle className="me-1" />
                                    Huỷ bỏ
                                </Button>

                                <Button
                                    variant="outline-secondary"
                                    type="button"
                                    size="sm"
                                    onClick={() => resetForm()}
                                >
                                    <BsArrowClockwise className="me-1" />
                                    Đặt lại
                                </Button>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting}
                                >
                                    <BsSave className="me-1" />
                                    {isSubmitting
                                        ? "Đang lưu..."
                                        : isEdit
                                          ? "Cập nhật"
                                          : "Lưu kế hoạch"}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

