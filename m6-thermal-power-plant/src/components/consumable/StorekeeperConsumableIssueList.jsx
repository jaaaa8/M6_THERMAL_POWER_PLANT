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
    BsArrowClockwise
} from "react-icons/bs";
import { toast } from "react-toastify";
import { authService } from "../../services/authService.js";

import DataTable from "../common/DataTable.jsx";
import consumableIssueService from "../../services/consumableIssueService.js";
import { workOrderService } from "../../services/workOrderService.js";
import ConsumableImportModal from "./ConsumableImportModal.jsx";
import * as consumableInventoryService from "../../services/consumableInventoryService.js";

export default function StorekeeperConsumableIssueList() {
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
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedConsumableForImport, setSelectedConsumableForImport] = useState(null);

    const currentUser = authService.getCurrentUser();
    const isStorekeeper = currentUser?.role === "MATERIALS_STOREKEEPER" || currentUser?.role === "ADMIN";

    useEffect(() => {
        loadData();
    }, [pagination.page, searchTrigger]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [
                issueResponse,
                workOrderResponse
            ] = await Promise.all([
                consumableIssueService.search({
                    page: pagination.page,
                    size: pagination.size,
                    keyword: filters.keyword || undefined,
                    status: filters.status || undefined
                }),
                workOrderService.getAll()
            ]);

            const issues = issueResponse.content || [];
            setPagination(prev => ({
                ...prev,
                totalPages: issueResponse.totalPages || 0,
                totalElements: issueResponse.totalElements || 0
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

            const tableData = issues.map((item) => ({
                id: item.id,
                issueCode: item.issueCode,
                workOrderCode: woMap[item.workOrderId] || "-",
                issuedBy: item.issuedByName || "-",
                issuedAt: item.issuedAt ? new Date(item.issuedAt).toLocaleString("vi-VN") : "-",
                detailCount: item.details?.length || 0,
                status: item.status || "-",
                rawData: item,
            }));

            setData(tableData);
        } catch (error) {
            console.error("Load Consumable Issue Error:", error);
            toast.error("Không thể tải danh sách phiếu yêu cầu cấp phát vật tư tiêu hao.");
        } finally {
            setLoading(false);
        }
    };

    const handlePdfUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Chỉ chấp nhận file PDF");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước file không vượt quá 5MB");
            return;
        }

        try {
            const uploadToast = toast.info("Đang tải file PDF lên...", { autoClose: false });
            const response = await consumableIssueService.uploadPdf(selectedIssue.id, file);
            toast.dismiss(uploadToast);
            setSelectedIssue(response);
            toast.success("Tải lên PDF chữ ký thành công!");
            loadData();
        } catch (error) {
            console.error("Lỗi upload PDF:", error);
            toast.error("Không thể tải file PDF lên Cloudinary");
        }
        event.target.value = "";
    };

    const handleCompleteIssue = async () => {
        if (!selectedIssue) return;
        try {
            const updatePayload = {
                id: selectedIssue.id,
                workOrderId: selectedIssue.workOrderId,
                issuedByName: currentUser?.username,
                issuedAt: selectedIssue.issuedAt ? selectedIssue.issuedAt.slice(0, 19) : new Date().toISOString().slice(0, 19),
                status: "COMPLETED",
                details: selectedIssue.details ? selectedIssue.details.map(d => ({
                    consumableId: d.consumableId,
                    quantity: d.quantity
                })) : []
            };
            const response = await consumableIssueService.update(updatePayload);
            setSelectedIssue(response);
            toast.success("Xác nhận hoàn thành phiếu xuất thành công!");
            setShowDetailModal(false);
            loadData();
        } catch (error) {
            console.error("Lỗi hoàn thành phiếu xuất:", error);
            const errData = error.response?.data;
            const errMsg = typeof errData === 'string' ? errData : errData?.message || error.message || "Lỗi khi cập nhật trạng thái";
            toast.error(errMsg);
        }
    };

    const handleOpenImportModalFromDetail = (detail) => {
        setSelectedConsumableForImport({
            id: detail.consumableId,
            consumableCode: detail.consumableCode,
            name: detail.consumableName,
            unitName: detail.unitName,
            manufacturer: ""
        });
        showImportModalForm();
    };

    const showImportModalForm = () => {
        setShowImportModal(true);
    };

    const handleImportSubmit = async (payload, { setSubmitting, resetForm }) => {
        try {
            await consumableInventoryService.importConsumable(payload);
            toast.success("Nhập kho vật tư tiêu hao thành công.");
            setShowImportModal(false);
            setSelectedConsumableForImport(null);
            resetForm();

            if (selectedIssue) {
                const updatedDetail = await consumableIssueService.getDetail(selectedIssue.id);
                setSelectedIssue(updatedDetail);
            }
            loadData();
        } catch (error) {
            console.error("Lỗi khi gửi yêu cầu nhập kho:", error);
            const msg = error.response?.data?.message || error.message || "Không thể lưu phiếu nhập kho.";
            toast.error(`Nhập kho thất bại: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleView = async (row) => {
        try {
            const detail = await consumableIssueService.getDetail(row.id);
            setSelectedIssue(detail);
            setShowDetailModal(true);
        } catch (error) {
            console.error("Lỗi tải chi tiết phiếu xuất:", error);
            toast.error("Không thể lấy thông tin chi tiết phiếu xuất.");
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
                        return <Badge bg="success">Hoàn Thành</Badge>;
                    case "PENDING":
                        return <Badge bg="warning">Đang xử lý</Badge>;
                    case "REJECTED":
                        return <Badge bg="danger">Từ chối</Badge>;
                    default:
                        return <Badge bg="secondary">Không xác định</Badge>;
                }
            },
        },
    ];

    return (
        <div className="animate-fade-in mt-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="mb-1 text-primary fw-bold">
                        Xuất vật tư tiêu hao theo phiếu yêu cầu
                    </h5>
                    <p className="text-muted small mb-0">
                        Thủ kho thực hiện kiểm tra tồn kho khả dụng, tải lên phiếu cấp đã ký và hoàn thành cấp phát
                    </p>
                </div>
            </div>

            <div className="surface-card p-3 mb-4">
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
                    <Col md={3}>
                        <Form.Select
                            value={filters.status}
                            onChange={(e) => {
                                setFilters({
                                    ...filters,
                                    status: e.target.value
                                });
                                setPagination(prev => ({ ...prev, page: 0 }));
                                setSearchTrigger(prev => prev + 1);
                            }}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Đang xử lý</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="REJECTED">Từ chối</option>
                        </Form.Select>
                    </Col>
                    <Col md={1} className="d-grid">
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setFilters({ keyword: "", status: "" });
                                setPagination(prev => ({ ...prev, page: 0 }));
                                setSearchTrigger(prev => prev + 1);
                            }}
                        >
                            <BsArrowClockwise />
                        </Button>
                    </Col>
                </Row>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                searchable={true}
                searchPlaceholder="Lọc nhanh kết quả..."
                pageSize={pagination.size}
                pagination={{
                    page: pagination.page,
                    totalPages: pagination.totalPages,
                    totalElements: pagination.totalElements,
                    onPageChange: (newPage) => {
                        setPagination(prev => ({ ...prev, page: newPage }));
                    }
                }}
                renderActions={(row) => (
                    <div className="data-table-actions">
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleView(row)}
                        >
                            <BsEye className="me-1" /> Chi tiết
                        </Button>
                    </div>
                )}
            />

            {/* Modal Chi tiết cấp phát vật tư */}
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                size="lg"
                centered
                backdrop="static"
            >
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold text-dark">
                        Chi tiết yêu cầu xuất vật tư tiêu hao
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {selectedIssue && (
                        <>
                            <Row className="g-3 mb-4">
                                <Col md={6}>
                                    <div className="p-3 border rounded bg-light">
                                        <div className="text-muted small">Mã phiếu cấp phát</div>
                                        <div className="fw-bold text-primary">{selectedIssue.issueCode}</div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="p-3 border rounded bg-light">
                                        <div className="text-muted small">Trạng thái phiếu</div>
                                        <div className="mt-1">
                                            {selectedIssue.status === "COMPLETED" && <Badge bg="success">Hoàn thành</Badge>}
                                            {selectedIssue.status === "PENDING" && <Badge bg="warning">Đang xử lý</Badge>}
                                            {selectedIssue.status === "REJECTED" && <Badge bg="danger">Từ chối</Badge>}
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="p-3 border rounded bg-light">
                                        <div className="text-muted small">Người yêu cầu</div>
                                        <div className="fw-semibold">{selectedIssue.issuedByName || "-"}</div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="p-3 border rounded bg-light">
                                        <div className="text-muted small">Ngày yêu cầu</div>
                                        <div className="fw-semibold">
                                            {selectedIssue.issuedAt ? new Date(selectedIssue.issuedAt).toLocaleString("vi-VN") : "-"}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <div className="mb-3">
                                <h6 className="fw-bold text-dark mb-3">Danh sách vật tư yêu cầu xuất:</h6>
                                <Table responsive bordered hover className="align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Hình ảnh</th>
                                            <th>Mã vật tư</th>
                                            <th>Tên vật tư</th>
                                            <th>Đơn vị</th>
                                            <th className="text-end">Yêu cầu</th>
                                            <th className="text-end">Tồn khả dụng</th>
                                            {selectedIssue.status !== "COMPLETED" && <th className="text-center">Trạng thái</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedIssue.details && selectedIssue.details.length > 0 ? (
                                            selectedIssue.details.map((detail, idx) => {
                                                const isAvailable = (detail.currentStock || 0) >= (detail.quantity || 0);
                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ width: "80px" }}>
                                                            <img
                                                                src={detail.imgPath || "https://png.pngtree.com/png-vector/20240805/ourlarge/pngtree-gear-machinery-metal-three-dimensional-png-image_13284500.png"}
                                                                alt={detail.consumableName}
                                                                style={{
                                                                    width: "50px",
                                                                    height: "50px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "6px",
                                                                    border: "1px solid #dee2e6"
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.src = "https://png.pngtree.com/png-vector/20240805/ourlarge/pngtree-gear-machinery-metal-three-dimensional-png-image_13284500.png";
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="fw-semibold">{detail.consumableCode}</td>
                                                        <td>{detail.consumableName}</td>
                                                        <td>
                                                            <Badge bg="secondary">{detail.unitName}</Badge>
                                                        </td>
                                                        <td className="text-end fw-bold text-dark">{detail.quantity}</td>
                                                        <td className="text-end fw-bold text-info">
                                                            {detail.currentStock != null ? detail.currentStock.toLocaleString("vi-VN") : 0}
                                                        </td>
                                                        {selectedIssue.status !== "COMPLETED" && (
                                                             <td className="text-center">
                                                                 {isAvailable ? (
                                                                     <Badge bg="success">Khả dụng</Badge>
                                                                 ) : (
                                                                     <div className="d-flex flex-column align-items-center gap-1">
                                                                         <Badge bg="danger">Không đủ tồn</Badge>
                                                                         {isStorekeeper && (
                                                                             <Button
                                                                                 size="sm"
                                                                                 variant="warning"
                                                                                 style={{ fontSize: "11px", padding: "2px 6px" }}
                                                                                 onClick={() => handleOpenImportModalFromDetail(detail)}
                                                                             >
                                                                                 Nhập thêm
                                                                             </Button>
                                                                         )}
                                                                     </div>
                                                                 )}
                                                             </td>
                                                         )}
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={selectedIssue.status !== "COMPLETED" ? 7 : 6} className="text-center text-muted">
                                                    Không có vật tư nào được liệt kê.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer className="bg-light d-flex justify-content-between align-items-center">
                    <div>
                        {selectedIssue && selectedIssue.status === "PENDING" && isStorekeeper && (
                            <>
                                <input
                                    id="signed-pdf-upload"
                                    type="file"
                                    accept="application/pdf"
                                    className="d-none"
                                    onChange={handlePdfUpload}
                                />
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => document.getElementById("signed-pdf-upload").click()}
                                >
                                    Tải lên PDF chữ ký
                                </Button>
                                {selectedIssue.attachmentPath && (
                                    <>
                                        <Button
                                            variant="info"
                                            size="sm"
                                            className="me-2 text-white"
                                            onClick={() => window.open(selectedIssue.attachmentPath, "_blank")}
                                        >
                                            Xem PDF đã ký
                                        </Button>
                                        <Button
                                            variant="success"
                                            size="sm"
                                            className="me-2"
                                            onClick={handleCompleteIssue}
                                        >
                                            Xác nhận hoàn thành
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                        {selectedIssue && selectedIssue.status !== "PENDING" && selectedIssue.attachmentPath && (
                            <Button
                                variant="info"
                                size="sm"
                                className="text-white"
                                onClick={() => window.open(selectedIssue.attachmentPath, "_blank")}
                            >
                                Xem PDF chữ ký
                            </Button>
                        )}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDetailModal(false)}
                    >
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Nhập kho từ chi tiết yêu cầu */}
            <ConsumableImportModal
                show={showImportModal}
                onHide={() => {
                    setShowImportModal(false);
                    setSelectedConsumableForImport(null);
                }}
                consumableItem={selectedConsumableForImport}
                onSubmit={handleImportSubmit}
            />
        </div>
    );
}
