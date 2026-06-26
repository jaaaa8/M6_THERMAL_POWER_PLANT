import { useState } from "react";
import {
    Table,
    Button,
    Pagination,
} from "react-bootstrap";

import {
    BsEye,
    BsPlusCircle,
    BsUpload
} from "react-icons/bs";

import { Link } from "react-router-dom";

import "../common/DataTable.css";

export default function TechnicalAssessmentList() {
    const [data] = useState([
        {
            id: 1,
            technicalCode: "DGKT-2026-001",
            workOrderCode: "WO-2026-001",
            assessor: "Nguyễn Văn A",
            system: "Hệ thống làm mát",
            equipment: "Bơm nước làm mát",
            status: "COMPLETED",
            createdDate: "2026-06-26",
        },
        {
            id: 2,
            technicalCode: "DGKT-2026-002",
            workOrderCode: "WO-2026-002",
            assessor: "Trần Văn B",
            system: "Hệ thống Turbine",
            equipment: "Turbine số 1",
            status: "WAITING_PDF",
            createdDate: "2026-06-25",
        },
        {
            id: 3,
            technicalCode: "DGKT-2026-003",
            workOrderCode: "WO-2026-003",
            assessor: "Lê Văn C",
            system: "Hệ thống nghiền than",
            equipment: "Máy nghiền than",
            status: "WAITING_PDF",
            createdDate: "2026-06-24",
        },
    ]);

    const getStatusBadge = (status) => {
        switch (status) {
            case "WAITING_PDF":
                return (
                    <span className="badge bg-warning">
          Chờ upload PDF
        </span>
                );

            case "COMPLETED":
                return (
                    <span className="badge bg-success">
          Hoàn Thành
        </span>
                );

            default:
                return (
                    <span className="badge bg-secondary">
          Không xác định
        </span>
                );
        }
    };

    const handleUploadPdf = async (technicalAssessmentId, file) => {
        if (!file) return;

        // Kiểm tra định dạng file
        if (file.type !== "application/pdf") {
            alert("Chỉ được upload file PDF");
            return;
        }

        const formData = new FormData();

        formData.append("file", file);
        formData.append(
            "technicalAssessmentId",
            technicalAssessmentId
        );

        try {
            const response = await fetch(
                `/api/technical-assessments/${technicalAssessmentId}/upload-pdf`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("Upload thất bại");
            }

            const result = await response.json();

            console.log("Upload thành công", result);

            alert("Upload PDF thành công");

            // cập nhật trạng thái trên table
            setTechnicalAssessments((prev) =>
                prev.map((item) =>
                    item.id === technicalAssessmentId
                        ? {
                            ...item,
                            status: "PDF_UPLOADED",
                            pdfUrl: result.pdfUrl,
                        }
                        : item
                )
            );
        } catch (error) {
            console.error(error);

            alert("Có lỗi xảy ra khi upload PDF");
        }
    };

    return (
        <div className="card shadow-sm">

            {/* Toolbar */}
            <div className="data-table-toolbar">
                <div className="data-table-count">
                    Tổng số: {data.length} phiếu đánh giá
                </div>

                <Link to="/repair/technical-assessment/add">
                    <Button size="sm">
                        <BsPlusCircle className="me-1" />
                        Thêm mới
                    </Button>
                </Link>
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <div className="data-table-scroll">

                    <Table
                        hover
                        responsive
                        className="data-table align-middle"
                    >
                        <thead>
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Lệnh công việc</th>
                            <th>Người đánh giá</th>
                            <th>Hệ thống</th>
                            <th>Thiết bị</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th width="140">
                                Thao tác
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {data.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <strong>
                                        {item.technicalCode}
                                    </strong>
                                </td>

                                <td>
                                    {item.workOrderCode}
                                </td>

                                <td>
                                    {item.assessor}
                                </td>

                                <td>
                                    {item.system}
                                </td>

                                <td>
                                    {item.equipment}
                                </td>

                                <td>
                                    {getStatusBadge(
                                        item.status
                                    )}
                                </td>

                                <td>
                                    {item.createdDate}
                                </td>

                                <td>
                                    <div className="action-buttons">

                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() => handleView(item)}
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
                                                        item.id,
                                                        e.target.files?.[0]
                                                    )
                                                }
                                            />
                                        </label>

                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>

                    </Table>

                </div>
            </div>

            {/* Pagination */}
            <div className="data-table-pagination">

                <div className="data-table-pagination-info">
                    Hiển thị 1 - {data.length}
                    trên {data.length} bản ghi
                </div>

                <Pagination size="sm">
                    <Pagination.Prev />

                    <Pagination.Item active>
                        1
                    </Pagination.Item>

                    <Pagination.Next />
                </Pagination>

            </div>

        </div>
    );
}