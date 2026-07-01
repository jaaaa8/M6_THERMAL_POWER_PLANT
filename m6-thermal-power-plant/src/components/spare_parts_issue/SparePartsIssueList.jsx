import { Button, Badge } from "react-bootstrap";
import {
    BsEye,
    BsUpload,
    BsPlusCircle,
} from "react-icons/bs";
import { Link } from "react-router-dom";

import DataTable from "../../components/common/DataTable";

export default function SparePartsIssueList() {

    const data = [
        {
            id: 1,
            sparePartCode: "PXVT-2026-001",
            workOrderCode: "WO-2026-001",
            technicalCode: "DGKT-2026-001",
            issuedBy: "Nguyễn Văn A",
            issuedAt: "26/06/2026 09:00",
            status: "WAITING_PDF",
        },
        {
            id: 2,
            sparePartCode: "PXVT-2026-002",
            workOrderCode: "WO-2026-002",
            technicalCode: "DGKT-2026-002",
            issuedBy: "Trần Văn B",
            issuedAt: "26/06/2026 14:30",
            status: "PDF_UPLOADED",
        },
    ];

    const columns = [
        {
            key: "sparePartCode",
            label: "Mã phiếu",
        },
        {
            key: "technicalCode",
            label: "Phiếu đánh giá",
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
            key: "status",
            label: "Trạng thái",
            render: (value) => {
                switch (value) {
                    case "WAITING_PDF":
                        return (
                            <Badge bg="warning">
                                Chờ upload PDF
                            </Badge>
                        );

                    case "PDF_UPLOADED":
                        return (
                            <Badge bg="success">
                                Đã upload PDF
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

    const handleView = (row) => {
        console.log("View:", row);
    };

    const handleUploadPdf = (id, file) => {
        if (!file) return;

        console.log("Upload PDF:", id, file);
    };

    return (
        <div className="page-container">

            <div className="page-header d-flex justify-content-between align-items-center mb-3">

                <div>
                    <h3 className="mb-1">
                        Danh sách phiếu xuất vật tư
                    </h3>

                    <p className="text-muted mb-0">
                        Quản lý cấp phát vật tư theo phiếu đánh giá kỹ thuật
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
                                accept=".pdf"
                                hidden
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

        </div>
    );
}