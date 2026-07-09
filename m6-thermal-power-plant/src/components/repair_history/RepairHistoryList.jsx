import { useState } from "react";
import {
    Card,
    Table,
    Button,
    Modal,
    Row,
    Col,
    Badge,
} from "react-bootstrap";
import { BsEyeFill } from "react-icons/bs";

export default function RepairHistoryList() {
    const [showModal, setShowModal] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);

    const repairHistories = [
        {
            id: 1,
            workOrder: {
                orderCode: "PCT-2026-001",
                leader: {
                    fullName: "Nguyễn Văn A",
                },
            },
            equipment: {
                kksCode: "PUMP-001",
                name: "Bơm nước làm mát",
                imgPath:
                    "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800",
            },
            repairDate: "2026-06-15",
            repairContent:
                "Thay vòng bi, kiểm tra độ rung và căn chỉnh trục.",
            repairResult:
                "Thiết bị hoạt động ổn định sau sửa chữa.",
            details: [
                {
                    id: 1,
                    quantity: 2,
                    sparePart: {
                        sparePartCode: "SP001",
                        name: "Vòng bi SKF 6205",
                        imgPath:
                            "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=500",
                        unit: {
                            unitName: "Cái",
                        },
                    },
                },
                {
                    id: 2,
                    quantity: 1,
                    sparePart: {
                        sparePartCode: "SP002",
                        name: "Phớt cơ khí",
                        imgPath:
                            "https://images.unsplash.com/photo-1581092160607-ee22731d8a08?w=500",
                        unit: {
                            unitName: "Bộ",
                        },
                    },
                },
            ],
        },
        {
            id: 2,
            workOrder: {
                orderCode: "PCT-2026-002",
                leader: {
                    fullName: "Trần Văn B",
                },
            },
            equipment: {
                kksCode: "MOTOR-002",
                name: "Động cơ quạt gió",
                imgPath:
                    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800",
            },
            repairDate: "2026-06-20",
            repairContent:
                "Thay bạc đạn và vệ sinh toàn bộ động cơ.",
            repairResult:
                "Động cơ vận hành bình thường.",
            details: [
                {
                    id: 3,
                    quantity: 2,
                    sparePart: {
                        sparePartCode: "SP003",
                        name: "Bạc đạn NSK",
                        imgPath:
                            "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500",
                        unit: {
                            unitName: "Cái",
                        },
                    },
                },
            ],
        },
    ];

    const handleView = (history) => {
        setSelectedHistory(history);
        setShowModal(true);
    };

    return (
        <>
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        Lịch sử sửa chữa thiết bị
                    </h5>
                </Card.Header>

                <Card.Body>
                    <Table
                        bordered
                        hover
                        responsive
                        className="align-middle"
                    >
                        <thead className="table-primary">
                        <tr>
                            <th width="60">#</th>
                            <th>Mã lệnh công việc</th>
                            <th>Mã thiết bị</th>
                            <th>Tên thiết bị</th>
                            <th>Ngày sửa chữa</th>
                            <th width="120">Thao tác</th>
                        </tr>
                        </thead>

                        <tbody>
                        {repairHistories.map((item, index) => (
                            <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>
                                    <Badge bg="primary">
                                        {item.workOrder.orderCode}
                                    </Badge>
                                </td>
                                <td>{item.equipment.kksCode}</td>
                                <td>{item.equipment.name}</td>
                                <td>{item.repairDate}</td>
                                <td>
                                    <Button
                                        size="sm"
                                        variant="info"
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
                </Card.Body>
            </Card>

            <Modal
                size="xl"
                show={showModal}
                onHide={() => setShowModal(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>
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
                                            selectedHistory.equipment
                                                .imgPath
                                        }
                                        alt=""
                                        className="img-fluid rounded border"
                                    />
                                </Col>

                                <Col md={8}>
                                    <Table bordered>
                                        <tbody>
                                        <tr>
                                            <th width="220">
                                                Lệnh công việc
                                            </th>
                                            <td>
                                                {
                                                    selectedHistory
                                                        .workOrder.orderCode
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Mã thiết bị</th>
                                            <td>
                                                {
                                                    selectedHistory
                                                        .equipment.kksCode
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Tên thiết bị</th>
                                            <td>
                                                {
                                                    selectedHistory
                                                        .equipment.name
                                                }
                                            </td>
                                        </tr>

                                        <tr>
                                            <th>Người phụ trách</th>
                                            <td>
                                                {
                                                    selectedHistory
                                                        .workOrder.leader
                                                        .fullName
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

                            <h5 className="mb-3">
                                Vật tư đã thay thế
                            </h5>

                            <Table
                                bordered
                                hover
                                responsive
                                className="align-middle"
                            >
                                <thead className="table-secondary">
                                <tr>
                                    <th>Ảnh</th>
                                    <th>Mã vật tư</th>
                                    <th>Tên vật tư</th>
                                    <th>Đơn vị</th>
                                    <th>Số lượng</th>
                                </tr>
                                </thead>

                                <tbody>
                                {selectedHistory.details.map(
                                    (detail) => (
                                        <tr key={detail.id}>
                                            <td width="90">
                                                <img
                                                    src={
                                                        detail.sparePart
                                                            .imgPath
                                                    }
                                                    alt=""
                                                    width="60"
                                                    height="60"
                                                    style={{
                                                        objectFit:
                                                            "cover",
                                                    }}
                                                    className="rounded border"
                                                />
                                            </td>

                                            <td>
                                                {
                                                    detail.sparePart
                                                        .sparePartCode
                                                }
                                            </td>

                                            <td>
                                                {
                                                    detail.sparePart
                                                        .name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    detail.sparePart
                                                        .unit.unitName
                                                }
                                            </td>

                                            <td>
                                                {detail.quantity}
                                            </td>
                                        </tr>
                                    )
                                )}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}