import { useEffect, useState } from "react";
import { getAllRepairHistories, getByEquipment } from "../../services/repairHistoryService";
import {
    Table,
    Button,
    Modal,
    Row,
    Col,
    Badge,
    Collapse,
    Card,
} from "react-bootstrap";
import { BsEyeFill, BsClockHistory } from "react-icons/bs";
import PageHeader from "../common/PageHeader";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import "./repairHistoryList.css";

export default function RepairHistoryList() {
    const [showModal, setShowModal] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [repairHistories, setRepairHistories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRepairHistories();
    }, []);

    const fetchRepairHistories = async () => {
        try {
            setLoading(true);

            const response = await getAllRepairHistories();

            console.log("Repair Histories:", response);

            setRepairHistories(response || []);
        } catch (error) {
            console.error("Load repair histories failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (history) => {
        setSelectedHistory(history);
        setShowModal(true);
    };

    return (
        <>
            <PageHeader
                icon={<BsClockHistory />}
                title="Lịch sử Sửa chữa"
                subtitle="Theo dõi lịch sử sửa chữa thiết bị trong nhà máy"
            />

            {loading ? (
                <LoadingSpinner text="Đang tải dữ liệu..." />
            ) : repairHistories.length === 0 ? (
                <EmptyState
                    icon={<BsClockHistory />}
                    title="Chưa có lịch sử sửa chữa"
                    message="Dữ liệu lịch sử sẽ hiển thị khi có phiếu công tác hoàn thành."
                />
            ) : (
                <div className="rh-table-wrapper card">
                    {/* Toolbar */}
                    <div className="rh-toolbar">
                        <span className="rh-result-count">
                            {repairHistories.length} bản ghi
                        </span>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <Table hover className="align-middle data-table mb-0">
                            <thead>
                            <tr>
                                <th width="60">#</th>
                                <th>Mã lệnh công việc</th>
                                <th>Mã thiết bị</th>
                                <th>Tên thiết bị</th>
                                <th>Ngày sửa chữa</th>
                                <th width="120" className="text-center">Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>
                            {repairHistories.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <Badge
                                            className="rh-order-badge"
                                            bg=""
                                        >
                                            {item.orderCode}
                                        </Badge>
                                    </td>
                                    <td className="font-mono">{item.kksCode}</td>
                                    <td>{item.equipmentName}</td>
                                    <td className="font-mono">{item.repairDate}</td>
                                    <td className="text-center">
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            className="d-inline-flex align-items-center gap-1"
                                            onClick={() =>
                                                handleView(item)
                                            }
                                        >
                                            <BsEyeFill /> Chi tiết
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
            )}

            <Modal
                size="xl"
                show={showModal}
                onHide={() => setShowModal(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <BsClockHistory style={{ color: 'var(--color-primary)' }} />
                        Chi tiết lịch sử sửa chữa
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {selectedHistory && (
                        <>
                            <Row className="mb-4">
                                <Col md={4}>
                                    <img
                                        src={
                                            selectedHistory.equipmentImg ||
                                            "https://via.placeholder.com/500x300?text=No+Image"
                                        }
                                        alt=""
                                        className="img-fluid rounded border"
                                    />
                                </Col>

                                <Col md={8}>
                                    <Table bordered className="rh-detail-table">
                                        <tbody>
                                        <tr>
                                            <th width="220">
                                                Lệnh công việc
                                            </th>
                                            <td>
                                                {
                                                    selectedHistory
                                                        .orderCode
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Mã thiết bị</th>
                                            <td>
                                                {
                                                    selectedHistory
                                                        .kksCode
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Tên thiết bị</th>
                                            <td>
                                                {
                                                    selectedHistory
                                                        .equipmentName
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Người phụ trách</th>
                                            <td>
                                                {
                                                    selectedHistory
                                                        .leaderName
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Ngày sửa chữa</th>
                                            <td>
                                                {
                                                    selectedHistory.repairDate
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Nội dung sửa chữa</th>
                                            <td>
                                                {
                                                    selectedHistory.repairContent
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Kết quả</th>
                                            <td>
                                                {
                                                    selectedHistory.repairResult
                                                }
                                            </td>
                                        </tr>
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>

                            <h5 className="mb-3 d-flex align-items-center gap-2">
                                <BsClockHistory style={{ color: 'var(--color-primary)' }} />
                                Vật tư đã thay thế
                            </h5>

                            <Table
                                bordered
                                hover
                                responsive
                                className="align-middle"
                            >
                                <thead>
                                <tr>
                                    <th>Ảnh</th>
                                    <th>Mã vật tư</th>
                                    <th>Tên vật tư</th>
                                    <th>Đơn vị</th>
                                    <th>Số lượng</th>
                                </tr>
                                </thead>

                                <tbody>
                                {selectedHistory.details?.map((detail) => (
                                    <tr key={detail.id}>
                                        <td width="90">
                                            <img
                                                src={
                                                    detail.imgPath ||
                                                    "https://via.placeholder.com/60"
                                                }
                                                alt=""
                                                width="60"
                                                height="60"
                                                className="rounded border"
                                            />
                                        </td>

                                        <td>{detail.sparePartCode}</td>

                                        <td>{detail.sparePartName}</td>

                                        <td>{detail.unitName}</td>

                                        <td>{detail.quantity}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

/* --- Tab nhung trong trang chi tiet thiet bi (logic tu main, dung chung service) --- */
export function RepairHistoryTab({ equipmentId }) {

    const [repairHistories, setRepairHistories] = useState([]);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        loadRepairHistory();
    }, [equipmentId]);

    const loadRepairHistory = async () => {
        try {
            const res = await getByEquipment(equipmentId);
            setRepairHistories(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <>

            <h5 className="fw-bold mb-4">
                Lịch sử sửa chữa
            </h5>

            {repairHistories.length === 0 ? (

                <div className="text-center py-5 text-muted border rounded bg-light">
                    Thiết bị chưa có lịch sử sửa chữa.
                </div>

            ) : (

                <Table hover bordered>

                    <thead className="table-light">

                        <tr>
                            <th width="5%">#</th>
                            <th>Mã công việc</th>
                            <th>Ngày sửa</th>
                            <th>Kết quả</th>
                            <th width="120">Thao tác</th>
                        </tr>

                    </thead>

                    <tbody>

                        {repairHistories.map((item, index) => (

                            <>
                                <tr key={item.id}>

                                    <td>{index + 1}</td>

                                    <td>{item.orderCode}</td>

                                    <td>{item.repairDate}</td>

                                    <td>
                                        <Badge bg="success">
                                            {item.repairResult}
                                        </Badge>
                                    </td>

                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() =>
                                                setOpenId(
                                                    openId === item.id
                                                        ? null
                                                        : item.id
                                                )
                                            }
                                        >
                                            {openId === item.id
                                                ? "Ẩn"
                                                : "Chi tiết"}
                                        </Button>
                                    </td>

                                </tr>

                                <tr>

                                    <td colSpan={5} className="p-0 border-0">

                                        <Collapse in={openId === item.id}>

                                            <div>

                                                <Card className="m-3 shadow-sm">

                                                    <Card.Body>

                                                        <h6 className="fw-bold mb-3">
                                                            Thông tin sửa chữa
                                                        </h6>

                                                        <p>
                                                            <b>Trưởng nhóm:</b>{" "}
                                                            {item.leaderName}
                                                        </p>

                                                        <p>
                                                            <b>Nội dung:</b>{" "}
                                                            {item.repairContent}
                                                        </p>

                                                        <p>
                                                            <b>Kết quả:</b>{" "}
                                                            {item.repairResult}
                                                        </p>

                                                        <hr />

                                                        <h6 className="fw-bold">
                                                            Phụ tùng sử dụng
                                                        </h6>

                                                        {item.details.length === 0 ? (

                                                            <div className="text-muted">
                                                                Không sử dụng phụ tùng
                                                            </div>

                                                        ) : (

                                                            <Table
                                                                bordered
                                                                size="sm"
                                                                className="mt-2"
                                                            >

                                                                <thead>

                                                                    <tr>
                                                                        <th>STT</th>
                                                                        <th>Mã</th>
                                                                        <th>Tên phụ tùng</th>
                                                                        <th>SL</th>
                                                                        <th>Đơn vị</th>
                                                                    </tr>

                                                                </thead>
                                                                <tbody>
                                                                    {item.details.map((d, i) => (

                                                                        <tr key={d.id}>

                                                                            <td>{i + 1}</td>

                                                                            <td>{d.sparePartCode}</td>

                                                                            <td>{d.sparePartName}</td>

                                                                            <td>{d.quantity}</td>

                                                                            <td>{d.unitName}</td>

                                                                        </tr>

                                                                    ))}

                                                                </tbody>

                                                            </Table>

                                                        )}

                                                    </Card.Body>

                                                </Card>

                                            </div>

                                        </Collapse>

                                    </td>

                                </tr>

                            </>

                        ))}

                    </tbody>

                </Table>

            )}

        </>
    );
}
