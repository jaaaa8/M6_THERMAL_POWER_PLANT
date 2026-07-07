import { useEffect, useState } from "react";
import { Button, Badge } from "react-bootstrap";
import {
    BsEye,
    BsUpload,
    BsPlusCircle,
} from "react-icons/bs";
import { Link } from "react-router-dom";

import DataTable from "../../components/common/DataTable";

import sparePartIssueService from "../../services/sparePartIssueService";
import { workOrderService } from "../../services/workOrderService";
import { employeeService } from "../../services/hr/EmployeeService";

export default function SparePartsIssueList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                issues,
                workOrderResponse,
                employeeResponse,
            ] = await Promise.all([
                sparePartIssueService.getAll(),
                workOrderService.getAll(),
                employeeService.getAll(),
            ]);
            console.log(import.meta.env.VITE_API_URL);

            const workOrderData = workOrderResponse?.data;

            console.log("workOrderData:", workOrderData);

            const workOrders = Array.isArray(workOrderData)
                ? workOrderData
                : Array.isArray(workOrderData?.content)
                    ? workOrderData.content
                    : [];

            const employeeData = employeeResponse?.data;

            const employees = Array.isArray(employeeData)
                ? employeeData
                : Array.isArray(employeeData?.content)
                    ? employeeData.content
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
            employees.forEach((item) => {
                employeeMap[item.id] =
                    item.fullName ||
                    item.employeeName ||
                    item.name ||
                    `EMP-${item.id}`;
            });

            console.log(issues);

            const tableData = issues.map((item) => ({
                id: item.id,

                sparePartCode: item.issueCode,

                workOrderCode:
                    workOrderMap[item.workOrderId] || "-",

                issuedBy:
                    employeeMap[item.issuedById] || "-",

                issuedAt: item.issuedAt
                    ? new Date(item.issuedAt).toLocaleString(
                        "vi-VN"
                    )
                    : "-",

                detailCount:
                    item.details?.length || 0,

                status:
                    item.details?.length > 0
                        ? "COMPLETED"
                        : "PENDING",

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
            key: "sparePartCode",
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
            label: "Số vật tư",
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
        </div>
    );
}