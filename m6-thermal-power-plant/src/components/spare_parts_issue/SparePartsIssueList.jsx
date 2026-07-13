import { useEffect, useState } from "react";
import {
    Button,
    Badge,
    Modal,
    Row,
    Col,
    Table
} from "react-bootstrap";
import {
    BsEye,
    BsUpload,
    BsPlusCircle,
} from "react-icons/bs";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import DataTable from "../../components/common/DataTable";

import sparePartIssueService from "../../services/sparePartIssueService";
import { workOrderService } from "../../services/workOrderService";
import {accountService} from "../../services/hr/accountService.js";
import * as sparePartService from "../../services/sparePartService";

export default function SparePartsIssueList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [spareParts, setSpareParts] = useState([]);
    const [workOrderMap, setWorkOrderMap] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                issues,
                workOrderResponse,
                accountResponse,
                sparePartResponse
            ] = await Promise.all([
                sparePartIssueService.getAll(),
                workOrderService.getAll(),
                accountService.getAll(),
                sparePartService.getAll(),
            ]);
            console.log(import.meta.env.VITE_API_URL);

            const workOrderData = workOrderResponse?.data;

            console.log("workOrderData:", workOrderData);

            const workOrders = Array.isArray(workOrderData)
                ? workOrderData
                : Array.isArray(workOrderData?.content)
                    ? workOrderData.content
                    : [];

            const woMap = {};

            workOrders.forEach(item => {
                woMap[item.id] =
                    item.workOrderCode ||
                    item.orderCode ||
                    `WO-${item.id}`;
            });

            setWorkOrderMap(woMap);

            const sparePartData =
                sparePartResponse?.data?.content ??
                sparePartResponse?.data ??
                [];

            setSpareParts(
                Array.isArray(sparePartData)
                    ? sparePartData
                    : []
            );

            const accountData = accountResponse?.data;

            const accounts = Array.isArray(accountData)
                ? accountData
                : Array.isArray(accountData?.content)
                    ? accountData.content
                    : [];

            const workOrderMap = {};
            workOrders.forEach((item) => {
                workOrderMap[item.id] =
                    item.workOrderCode ||
                    item.code ||
                    item.orderCode ||
                    `WO-${item.id}`;
            });



            const employeeMap = {};
            accounts.forEach((item) => {
                employeeMap[item.username] =
                    item.fullName ||
                    item.username ||
                    item.name ||
                    `EMP-${item.username}`;
            });

            console.log(issues);
            console.log(employeeMap);

            const tableData = issues.map((item) => ({
                id: item.id,

                issueCode: item.issueCode,

                workOrderCode:
                    workOrderMap[item.workOrderId] || "-",

                issuedBy:
                    employeeMap[item.issueUsername] || "-",

                issuedAt: item.issuedAt
                    ? new Date(item.issuedAt).toLocaleString(
                        "vi-VN"
                    )
                    : "-",

                detailCount:
                    item.details?.length || 0,

                status:
                    item.status || "-",

                rawData: item,
            }));

            setData(tableData);
            console.log(issues);
        } catch (error) {
            console.error(
                "Load Spare Parts Issue Error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: "issueCode",
            label: "Mã phiếu",
        },
        {
            key: "workOrderCode",
            label: "Lệnh công việc",
        },
        {
            key: "issuedBy",
            label: "Người cấp phát",
        },
        {
            key: "issuedAt",
            label: "Ngày cấp phát",
        },
        {
            key: "detailCount",
            label: "Số loại vật tư",
        },
        {
            key: "status",
            label: "Trạng thái",
            render: (value) => {
                switch (value) {
                    case "COMPLETED":
                        return (
                            <Badge bg="success">
                                Hoàn Thành
                            </Badge>
                        );

                    case "PENDING":
                        return (
                            <Badge bg="warning">
                                Chưa upload Phiếu xuất vật tư
                            </Badge>
                        );

                    default:
                        return (
                            <Badge bg="secondary">
                                Không xác định
                            </Badge>
                        );
                }
            },
        },
    ];

    const handleView = async (row) => {
        try {
            setShowDetailModal(true);
            setDetailLoading(true);
            setSelectedIssue(null);

            const detail =
                await sparePartIssueService.getDetail(
                    row.id
                );

            setSelectedIssue(detail);
        } catch (error) {
            console.error(error);
        } finally {
            setDetailLoading(false);
        }
    };
    const renderStatus = (status) => {
        switch (status) {
            case "COMPLETED":
                return (
                    <Badge bg="success">
                        Hoàn thành
                    </Badge>
                );

            case "PENDING":
                return (
                    <Badge bg="warning">
                        Chờ upload PDF
                    </Badge>
                );

            default:
                return (
                    <Badge bg="secondary">
                        Không xác định
                    </Badge>
                );
        }
    };

    const handleUploadPdf = async (id, file) => {
        if (!file) return;

        try {
            setLoading(true);
            console.log("ID:", id);
            console.log("FILE:", file);

            const result =
                await sparePartIssueService.uploadPdf(
                    id,
                    file
                );

            console.log("Upload Success:", result);

            alert("Upload PDF thành công");

            await loadData();
        } catch (error) {
            console.error(
                "Upload PDF Error:",
                error.response?.data || error
            );

            alert(
                error.response?.data?.message ||
                "Upload PDF thất bại"
            );
        } finally {
            setLoading(false);
        }
    };

    const sparePartMap = useMemo(() => {
        const map = {};

        spareParts.forEach((sp) => {
            map[sp.id] = sp;
        });

        return map;
    }, [spareParts]);
    console.log("SPARE PARTS", spareParts);

    return (
        <div className="page-container">
            <div className="page-header d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h3 className="mb-1">
                        Danh sách phiếu xuất vật tư
                    </h3>

                    <p className="text-muted mb-0">
                        Quản lý cấp phát vật tư theo phiếu xuất kho
                    </p>
                </div>

                <Button
                    as={Link}
                    to="/repair/spare-parts-issue/add"
                    size="sm"
                >
                    <BsPlusCircle className="me-1" />
                    Thêm mới
                </Button>
            </div>

            <DataTable
                loading={loading}
                data={data}
                columns={columns}
                searchPlaceholder="Tìm kiếm phiếu xuất vật tư..."
                renderActions={(row) => (
                    <div className="data-table-actions">
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleView(row)}
                        >
                            <BsEye />
                        </Button>

                        <label className="btn btn-sm btn-outline-success m-0">
                            <BsUpload />

                            <input
                                type="file"
                                hidden
                                accept=".pdf"
                                onChange={(e) =>
                                    handleUploadPdf(
                                        row.id,
                                        e.target.files?.[0]
                                    )
                                }
                            />
                        </label>
                    </div>
                )}
            />
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                size="xl"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Chi tiết phiếu xuất vật tư
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {detailLoading ? (
                        <div className="text-center py-4">
                            Đang tải dữ liệu...
                        </div>
                    ) : (
                        selectedIssue && (
                            <>
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <strong>Mã phiếu:</strong>
                                        <div>{selectedIssue.issueCode}</div>
                                    </Col>

                                    <Col md={4}>
                                        <strong>Lệnh công việc:</strong>
                                        <div>
                                            {workOrderMap[selectedIssue.workOrderId] || "-"}
                                        </div>
                                    </Col>

                                    <Col md={4}>
                                        <strong>Trạng thái:</strong>
                                        <div>
                                            {renderStatus(selectedIssue.status)}
                                        </div>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={4}>
                                        <strong>Người cấp phát:</strong>
                                        <div>
                                            {selectedIssue.issueUsername}
                                        </div>
                                    </Col>

                                    <Col md={4}>
                                        <strong>Ngày cấp phát:</strong>
                                        <div>
                                            {selectedIssue.issuedAt
                                                ? new Date(
                                                    selectedIssue.issuedAt
                                                ).toLocaleString("vi-VN")
                                                : "-"}
                                        </div>
                                    </Col>

                                    <Col md={4}>
                                        <strong>File PDF:</strong>

                                        <div>
                                            {selectedIssue.attachmentPath ? (
                                                <a
                                                    href={`${import.meta.env.VITE_API_URL}${selectedIssue.attachmentPath}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Xem PDF
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                <hr />

                                <h5 className="mb-3">
                                    Danh sách vật tư xuất kho
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
                                        <th>Mã VT</th>
                                        <th>Tên vật tư</th>
                                        <th>Đơn vị</th>
                                        <th>Số lượng</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {selectedIssue.details?.map(
                                        (detail, index) => {
                                            const sparePart =
                                                sparePartMap[
                                                    detail.sparePartId
                                                    ];

                                            return (
                                                <tr key={index}>
                                                    <td>
                                                        <img
                                                            src={
                                                                (sparePart?.imgPath ? sparePart.imgPath.split('|').filter(Boolean)[0] : null) ||
                                                                sparePart?.image ||
                                                                sparePart?.imageUrl ||
                                                                "/images/no-image.png"
                                                            }
                                                            alt={
                                                                sparePart?.name
                                                            }
                                                            width="60"
                                                            onError={(e) => { e.target.src = "/images/no-image.png"; }}
                                                        />
                                                    </td>

                                                    <td>
                                                        {sparePart?.sparePartCode}
                                                    </td>

                                                    <td>
                                                        {sparePart?.name}
                                                    </td>

                                                    <td>
                                                        {sparePart?.unitName || "Cái"}
                                                    </td>

                                                    <td>
                                                        {detail.quantity}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                    </tbody>
                                </Table>
                            </>
                        )
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowDetailModal(false)
                        }
                    >
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>

    );
}