import { useEffect, useState } from "react";
import { Table, Button, Form, Pagination, Modal, Row, Col } from "react-bootstrap";
import {
    BsEye,
    BsSearch,
    BsArrowClockwise,
    BsPlusLg,
    BsDropletHalf,
    BsChevronLeft,
    BsChevronRight,
} from "react-icons/bs";
import { Link } from "react-router-dom";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import lubricationPlanService from "../../services/lubricationPlanService";
import "./MaintenancePlanList.css";

/* Ánh xạ trạng thái BE → biến thể StatusBadge của hệ thống */
const STATUS_MAP = {
    NOT_LUBRICATED: { status: "inactive", label: "Chưa bảo dưỡng" },
    DUE_FOR_LUBRICATION: { status: "warning", label: "Đến hạn bảo dưỡng" },
    DUE_SOON: { status: "info", label: "Sắp đến hạn" },
    LUBRICATED: { status: "normal", label: "Đã bảo dưỡng" },
    OVERDUE: { status: "danger", label: "Quá hạn" },
};

const renderPlanStatus = (status) => {
    const cfg = STATUS_MAP[status] || { status: "inactive", label: status };
    return <StatusBadge status={cfg.status} label={cfg.label} pulse={status === "OVERDUE"} />;
};

const getCycleName = (days) => {
    switch (days) {
        case 7:
            return "1 tuần";
        case 30:
            return "1 tháng";
        case 90:
            return "3 tháng";
        case 180:
            return "6 tháng";
        default:
            return `${days} ngày`;
    }
};

const PAGE_SIZE = 10;

export default function MaintenancePlanList() {
    const [plans, setPlans] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [pagination, setPagination] = useState({
        page: 0,
        size: PAGE_SIZE,
        totalPages: 0,
        totalElements: 0,
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page]);

    const loadData = async (
        keyword = search,
        searchStatus = status,
        page = pagination.page
    ) => {
        try {
            setLoading(true);
            const res = await lubricationPlanService.search(
                keyword,
                searchStatus,
                page,
                pagination.size
            );
            setPlans(res.content || []);
            setPagination((prev) => ({
                ...prev,
                page,
                totalPages: res.totalPages,
                totalElements: res.totalElements,
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchClick = () => loadData(search, status, 0);

    const handleResetSearch = async () => {
        setSearch("");
        setStatus("");
        await loadData("", "", 0);
    };

    const goToPage = (page) => {
        if (page >= 0 && page < pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page }));
        }
    };

    const handleView = (plan) => {
        setSelectedPlan(plan);
        setShowDetail(true);
    };
    // Dải số trang tối đa 5 nút quanh trang hiện tại (giống DataTable chung của hệ thống)
    const pageNumbers = (() => {
        const total = pagination.totalPages;
        const current = pagination.page;
        if (total <= 5) return [...Array(total)].map((_, i) => i);
        if (current <= 2) return [0, 1, 2, 3, 4];
        if (current >= total - 3)
            return [total - 5, total - 4, total - 3, total - 2, total - 1];
        return [current - 2, current - 1, current, current + 1, current + 2];
    })();

    return (
        <div className="animate-fade-in">
            <PageHeader
                icon={<BsDropletHalf />}
                title="Kế hoạch Bảo dưỡng Dầu mỡ"
                subtitle="Quản lý kế hoạch bảo dưỡng, bôi trơn theo hệ thống"
                actions={
                    <Button
                        as={Link}
                        to="/lubrication/plant/add"
                        variant="primary"
                        size="sm"
                    >
                        <BsPlusLg className="me-1" /> Thêm mới
                    </Button>
                }
            />

            <div className="data-table-wrapper surface-card">
                {/* Toolbar: lọc theo keyword + trạng thái (server-side) */}
                <div className="data-table-toolbar mpl-toolbar">
                    <span className="data-table-count">
                        Tổng cộng <strong>{pagination.totalElements}</strong> kế hoạch
                    </span>
                    <div className="mpl-toolbar-actions">
                        <Form.Control
                            size="sm"
                            placeholder="Mã kế hoạch, thiết bị..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                            className="mpl-search-input"
                        />
                        <Form.Select
                            size="sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mpl-status-select"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="NOT_LUBRICATED">Chưa bảo dưỡng</option>
                            <option value="DUE_FOR_LUBRICATION">Đến hạn bảo dưỡng</option>
                            <option value="DUE_SOON">Sắp đến hạn</option>
                            <option value="LUBRICATED">Đã bảo dưỡng</option>
                            <option value="OVERDUE">Quá hạn</option>
                        </Form.Select>
                        <Button variant="primary" size="sm" onClick={handleSearchClick}>
                            <BsSearch className="me-1" /> Tìm kiếm
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={handleResetSearch}
                        >
                            <BsArrowClockwise className="me-1" /> Làm mới
                        </Button>
                    </div>
                </div>
                {/* Bảng dữ liệu */}
                {loading ? (
                    <LoadingSpinner text="Đang tải dữ liệu..." />
                ) : plans.length === 0 ? (
                    <EmptyState
                        icon={<BsDropletHalf />}
                        title="Chưa có kế hoạch bảo dưỡng"
                        message={
                            search || status
                                ? "Không tìm thấy kế hoạch nào khớp bộ lọc."
                                : "Dữ liệu sẽ hiển thị khi có kế hoạch được tạo."
                        }
                    />
                ) : (
                    <div className="data-table-scroll">
                        <Table hover className="data-table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Mã kế hoạch</th>
                                    <th>Thiết bị</th>
                                    <th>Chu kỳ</th>
                                    <th>Ngày tiếp theo</th>
                                    <th>Vật tư</th>
                                    <th>SL</th>
                                    <th>Trạng thái</th>
                                    <th style={{ width: 90 }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((plan) => (
                                    <tr key={plan.id}>
                                        <td className="font-mono">{plan.lubricationCode}</td>
                                        <td>{plan.equipment?.name || "-"}</td>
                                        <td>{getCycleName(plan.cycleDays)}</td>
                                        <td>{plan.nextDueDate}</td>
                                        <td>{plan.consumable?.name || "-"}</td>
                                        <td>{plan.quantity}</td>
                                        <td>{renderPlanStatus(plan.status)}</td>
                                        <td>
                                            <div className="data-table-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Xem chi tiết"
                                                    onClick={() => handleView(plan)}
                                                >
                                                    <BsEye />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {/* Phân trang server-side */}
                {pagination.totalPages > 1 && (
                    <div className="data-table-pagination">
                        <span className="data-table-pagination-info">
                            Hiển thị {plans.length} / {pagination.totalElements} kế hoạch
                            {" — "}Trang {pagination.page + 1} / {pagination.totalPages}
                        </span>
                        <Pagination size="sm" className="mb-0">
                            <Pagination.Prev
                                disabled={pagination.page === 0}
                                onClick={() => goToPage(pagination.page - 1)}
                            >
                                <BsChevronLeft />
                            </Pagination.Prev>
                            {pageNumbers.map((p) => (
                                <Pagination.Item
                                    key={p}
                                    active={p === pagination.page}
                                    onClick={() => goToPage(p)}
                                >
                                    {p + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next
                                disabled={pagination.page >= pagination.totalPages - 1}
                                onClick={() => goToPage(pagination.page + 1)}
                            >
                                <BsChevronRight />
                            </Pagination.Next>
                        </Pagination>
                    </div>
                )}
            </div>
            {/* Modal chi tiết */}
            <Modal
                size="lg"
                show={showDetail}
                onHide={() => setShowDetail(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <BsDropletHalf style={{ color: "var(--color-primary)" }} />
                        Chi tiết kế hoạch bôi trơn
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPlan && (
                        <>
                            <div className="mpl-detail-section">
                                <h6 className="mpl-detail-title">Thông tin kế hoạch</h6>
                                <Row>
                                    <Col md={6}>
                                        <p>
                                            <strong>Mã kế hoạch:</strong>
                                            <br />
                                            {selectedPlan.lubricationCode}
                                        </p>
                                        <p>
                                            <strong>Hệ thống:</strong>
                                            <br />
                                            {selectedPlan.equipment?.system?.name || "-"}
                                        </p>
                                        <p>
                                            <strong>Thiết bị:</strong>
                                            <br />
                                            {selectedPlan.equipment?.name || "-"}
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p>
                                            <strong>Mã thiết bị:</strong>
                                            <br />
                                            {selectedPlan.equipment?.equipmentCode || "-"}
                                        </p>
                                        <p>
                                            <strong>Chu kỳ:</strong>
                                            <br />
                                            {getCycleName(selectedPlan.cycleDays)}
                                        </p>
                                        <p>
                                            <strong>Ngày bảo dưỡng tiếp theo:</strong>
                                            <br />
                                            {selectedPlan.nextDueDate}
                                        </p>
                                        <p>
                                            <strong>Trạng thái:</strong>
                                            <br />
                                            {renderPlanStatus(selectedPlan.status)}
                                        </p>
                                    </Col>
                                </Row>
                            </div>
                            <div className="mpl-detail-section">
                                <h6 className="mpl-detail-title">Vật tư sử dụng</h6>
                                <Row className="align-items-center">
                                    <Col md={4} className="text-center">
                                        <img
                                            src={
                                                selectedPlan.consumable?.imgPath ||
                                                "/images/no-image.png"
                                            }
                                            alt={selectedPlan.consumable?.name || "Vật tư"}
                                            className="mpl-detail-img"
                                        />
                                    </Col>
                                    <Col md={8}>
                                        <Row>
                                            <Col md={6}>
                                                <p>
                                                    <strong>Mã vật tư:</strong>
                                                    <br />
                                                    {selectedPlan.consumable?.consumableCode ||
                                                        "-"}
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p>
                                                    <strong>Số lượng:</strong>
                                                    <br />
                                                    {selectedPlan.quantity}
                                                </p>
                                            </Col>
                                        </Row>
                                        <p>
                                            <strong>Tên vật tư:</strong>
                                            <br />
                                            {selectedPlan.consumable?.name || "-"}
                                        </p>
                                        <p>
                                            <strong>Đơn vị:</strong>
                                            <br />
                                            {selectedPlan.consumable?.unit?.unitName || "-"}
                                        </p>
                                        <p>
                                            <strong>Trạng thái:</strong>
                                            <br />
                                            {selectedPlan.consumable?.status === "ACTIVE" ? (
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
                                        </p>
                                    </Col>
                                </Row>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowDetail(false)}
                    >
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

