import { useEffect, useState } from "react";
import {
    Button,
    Badge,
    Modal,
    Row,
    Col,
    Table,
    Form

} from "react-bootstrap";
import {
    BsEye,
    BsPlusCircle,
    BsArrowClockwise
} from "react-icons/bs";
import { Link } from "react-router-dom";

import DataTable from "../../components/common/DataTable";

import sparePartIssueService from "../../services/sparePartIssueService";
import { workOrderService } from "../../services/workOrderService";

export default function SparePartsIssueList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [workOrderMap, setWorkOrderMap] = useState({});
    const [filters, setFilters] = useState({
        keyword: "",
        status: ""
    });
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalPages: 0,
        totalElements: 0
    });
    const [searchTrigger, setSearchTrigger] = useState(0);

    useEffect(() => {
        loadData();
    }, [pagination.page, searchTrigger]);

    const loadData = async () => {
        try {
            const [
                issueResponse,
                workOrderResponse
            ] = await Promise.all([
                sparePartIssueService.search({
                    page: pagination.page,
                    size: pagination.size,

                    keyword:
                        filters.keyword || undefined,

                    status:
                        filters.status || undefined
                }),

                workOrderService.getAll()
            ]);

            const issues =
                issueResponse.content || [];

            setPagination(prev => ({
                ...prev,
                totalPages:
                    issueResponse.totalPages || 0,

                totalElements:
                    issueResponse.totalElements || 0
            }));

            const workOrderData = workOrderResponse?.data;


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

            const workOrderMap = {};
            workOrders.forEach((item) => {
                workOrderMap[item.id] =
                    item.workOrderCode ||
                    item.code ||
                    item.orderCode ||
                    `WO-${item.id}`;
            });

            console.log("issues content:", issues);

            const tableData = issues.map((item) => ({
                id: item.id,

                issueCode: item.issueCode,

                workOrderCode:
                    workOrderMap[item.workOrderId] || "-",


                issuedBy:
                    item.issuedBy?.employee?.employeeName
                    ||
                    item.issuedBy?.username
                    ||
                    "-",


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
            label: "Người yêu cầu",
        },
        {
            key: "issuedAt",
            label: "Ngày yêu cầu",
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
                                Đang xử lý
                            </Badge>
                        );
                    case "REJECTED":
                        return (
                            <Badge bg="danger">
                                Từ chối
                            </Badge>
                        )

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

    const handleView = (row) => {
        setSelectedIssue(row.rawData);
        setShowDetailModal(true);
    };


    const renderStatus = (status) => {
        switch (status) {
            case "COMPLETED":
                return <Badge bg="success">Hoàn thành</Badge>;

            case "PENDING":
                return <Badge bg="warning">Đang xử lý</Badge>;

            case "REJECTED":
                return <Badge bg="danger">Từ chối</Badge>;

            default:
                return <Badge bg="secondary">Không xác định</Badge>;
        }
    };

    return (

        <div className="page-container">
            <div className="page-header d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h3 className="mb-1">
                        Danh sách phiếu xuất vật tư thay thế
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

            <div className="card mb-3">
                <div className="card-body">

                    <Row className="g-2">

                        <Col md={8}>
                            <Form.Control
                                placeholder="Tìm theo mã phiếu, lệnh công việc hoặc người yêu cầu"
                                value={filters.keyword}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        keyword: e.target.value
                                    })
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {

                                        setPagination(prev => ({
                                            ...prev,
                                            page: 0
                                        }));

                                        setSearchTrigger(prev => prev + 1);
                                    }
                                }}
                            />
                        </Col>

                        <Col md={2}>
                            <Form.Select
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        status: e.target.value
                                    })
                                }
                            >
                                <option value="">
                                    Tất cả trạng thái
                                </option>

                                <option value="PENDING">
                                    Đang xử lý
                                </option>

                                <option value="COMPLETED">
                                    Hoàn thành
                                </option>

                                <option value="REJECTED">
                                    Từ chối
                                </option>
                            </Form.Select>
                        </Col>

                        <Col md={1}>
                            <Button
                                className="w-100"
                                onClick={() => {

                                    setPagination(prev => ({
                                        ...prev,
                                        page: 0
                                    }));

                                    setSearchTrigger(prev => prev + 1);

                                }}
                            >
                                Tìm kiếm
                            </Button>

                        </Col>
                        <Col md={1}>
                            <Button
                                variant="outline-secondary"
                                onClick={() => {

                                    setFilters({
                                        keyword: "",
                                        status: ""
                                    });

                                    setPagination(prev => ({
                                        ...prev,
                                        page: 0
                                    }));

                                    setSearchTrigger(prev => prev + 1);

                                }}
                            >
                                <BsArrowClockwise />
                            </Button>
                        </Col>

                    </Row>

                </div>
            </div>

            <div className="mb-2 text-muted">
                Tổng số phiếu:
                <strong>
                    {" "}
                    {pagination.totalElements}
                    {" "}
                </strong>
                phiếu
            </div>

            <DataTable
                loading={loading}
                data={data}
                searchable={false}
                columns={columns}
                renderActions={(row) => (
                    <div className="data-table-actions">
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleView(row)}
                        >
                            <BsEye />
                        </Button>
                    </div>
                )}
            />

            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                size="xl"
                centered
            >
                <Modal.Header
                    closeButton
                    className="bg-primary text-white"
                >
                    <Modal.Title>
                        Chi tiết phiếu xuất vật tư
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="bg-light">

                    {selectedIssue && (
                        <>
                            {/* THÔNG TIN CHUNG */}
                            <div className="bg-white rounded shadow-sm p-3 mb-4">
                                <h5 className="border-bottom pb-2 mb-3">
                                    Thông tin phiếu xuất
                                </h5>

                                <Row className="g-3">

                                    <Col md={4}>
                                        <div className="text-muted small">
                                            Mã phiếu
                                        </div>
                                        <div className="fw-bold">
                                            {selectedIssue.issueCode}
                                        </div>
                                    </Col>

                                    <Col md={4}>
                                        <div className="text-muted small">
                                            Lệnh công việc
                                        </div>
                                        <div className="fw-bold">
                                            {
                                                workOrderMap[
                                                    selectedIssue.workOrderId
                                                    ] || "-"
                                            }
                                        </div>
                                    </Col>

                                    <Col md={4}>
                                        <div className="text-muted small">
                                            Trạng thái
                                        </div>
                                        <div>
                                            {renderStatus(selectedIssue.status)}
                                        </div>
                                    </Col>

                                    <Col md={4}>
                                        <div className="text-muted small">
                                            Người yêu cầu
                                        </div>

                                        <div className="fw-semibold">
                                            {
                                                selectedIssue.issuedBy?.employee
                                                    ?.employeeName
                                            }
                                        </div>

                                        <small className="text-muted">
                                            {
                                                selectedIssue.issuedBy?.username
                                            }
                                        </small>
                                    </Col>

                                    <Col md={4}>
                                        <div className="text-muted small">
                                            Ngày cấp phát
                                        </div>

                                        <div className="fw-semibold">
                                            {
                                                selectedIssue.issuedAt
                                                    ? new Date(
                                                        selectedIssue.issuedAt
                                                    ).toLocaleString("vi-VN")
                                                    : "-"
                                            }
                                        </div>
                                    </Col>

                                    <Col md={4}>
                                        <div className="text-muted small">
                                            Tổng loại vật tư
                                        </div>

                                        <div className="fw-bold text-primary">
                                            {
                                                selectedIssue.details?.length || 0
                                            }
                                        </div>
                                    </Col>

                                </Row>
                            </div>

                            {/* DANH SÁCH VẬT TƯ */}
                            <div className="bg-white rounded shadow-sm p-3">

                                <div className="d-flex justify-content-between align-items-center mb-3">

                                    <h5 className="mb-0">
                                        Danh sách vật tư xuất kho
                                    </h5>

                                    <Badge bg="primary">
                                        {selectedIssue.details?.length || 0}
                                        {" "}vật tư
                                    </Badge>

                                </div>

                                <Table
                                    striped
                                    hover
                                    responsive
                                    className="align-middle mb-0"
                                >
                                    <thead className="table-primary">
                                    <tr>
                                        <th width="70">
                                            STT
                                        </th>

                                        <th width="100">
                                            Hình ảnh
                                        </th>

                                        <th>
                                            Mã vật tư
                                        </th>

                                        <th>
                                            Tên vật tư
                                        </th>

                                        <th width="120">
                                            Đơn vị
                                        </th>

                                        <th width="120">
                                            Số lượng
                                        </th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {
                                        selectedIssue.details?.map(
                                            (detail, index) => (

                                                <tr key={index}>

                                                    <td>
                                                        {index + 1}
                                                    </td>

                                                    <td>
                                                        <img
                                                            src={
                                                                detail.imgPath
                                                                    ? `${detail.imgPath}`
                                                                    : "https://png.pngtree.com/png-vector/20240805/ourlarge/pngtree-gear-machinery-metal-three-dimensional-png-image_13284500.png"
                                                            }
                                                            alt={detail.sparePartName}
                                                            style={{
                                                                width: "60px",
                                                                height: "60px",
                                                                objectFit: "cover",
                                                                borderRadius: "8px",
                                                                border: "1px solid #dee2e6"
                                                            }}
                                                            onError={(e) => {
                                                                e.target.src = "https://png.pngtree.com/png-vector/20240805/ourlarge/pngtree-gear-machinery-metal-three-dimensional-png-image_13284500.png";
                                                            }}
                                                        />
                                                    </td>

                                                    <td>
                    <span className="fw-semibold">
                        {detail.sparePartCode}
                    </span>
                                                    </td>

                                                    <td>
                                                        {detail.sparePartName}
                                                    </td>

                                                    <td>
                                                        <Badge bg="secondary">
                                                            {detail.unit}
                                                        </Badge>
                                                    </td>

                                                    <td>
                    <span className="fw-bold text-success">
                        {detail.quantity}
                    </span>
                                                    </td>

                                                </tr>
                                            )
                                        )
                                    }
                                    </tbody>
                                </Table>

                            </div>
                        </>
                    )}

                </Modal.Body>

                <Modal.Footer className="bg-light">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDetailModal(false)}
                    >
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>

    );
}