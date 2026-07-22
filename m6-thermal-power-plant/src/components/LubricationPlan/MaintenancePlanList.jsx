import { useState } from "react";
import { Button } from "react-bootstrap";
import { BsPencil, BsTrash, BsPlusLg, BsDropletHalf } from "react-icons/bs";
import { Link } from "react-router-dom";
import PageHeader from "../common/PageHeader";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";

/* Ánh xạ trạng thái (VN) → biến thể StatusBadge của hệ thống */
const STATUS_MAP = {
    "Đang hoạt động": "normal",
    "Tạm dừng": "inactive",
};

export default function MaintenancePlanList() {
    // demo data
    const [plans] = useState([
        { id: 1, code: "KHBD-001", name: "Bảo dưỡng hệ thống bơm", system: "Hệ thống bơm", frequency: "Hàng tháng", status: "Đang hoạt động" },
        { id: 2, code: "KHBD-002", name: "Bảo dưỡng turbine", system: "Turbine", frequency: "Hàng quý", status: "Tạm dừng" },
    ]);

    const columns = [
        { key: "code", label: "Mã", mono: true, width: 160 },
        { key: "name", label: "Tên kế hoạch" },
        { key: "system", label: "Hệ thống" },
        { key: "frequency", label: "Tần suất" },
        {
            key: "status",
            label: "Trạng thái",
            render: (val) => <StatusBadge status={STATUS_MAP[val] || "inactive"} label={val} />,
        },
    ];

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Kế hoạch Bảo dưỡng Dầu mỡ"
                subtitle="Quản lý kế hoạch bảo dưỡng, bôi trơn theo hệ thống"
                icon={<BsDropletHalf />}
                actions={
                    <Button as={Link} to="/lubrication/plant/add" variant="primary" size="sm">
                        <BsPlusLg className="me-1" /> Thêm mới
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={plans}
                pageSize={5}
                searchPlaceholder="Tìm kiếm kế hoạch..."
                renderActions={() => (
                    <div className="data-table-actions">
                        <button className="btn btn-sm btn-outline-secondary" title="Sửa">
                            <BsPencil />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="Xoá">
                            <BsTrash />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}
