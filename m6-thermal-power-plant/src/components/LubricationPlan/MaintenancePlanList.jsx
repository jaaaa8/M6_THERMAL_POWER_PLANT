import { useState } from "react";
import { Table, Button, Form, Pagination } from "react-bootstrap";
import {BsPencil, BsTrash, BsSearch, BsPlusCircle} from "react-icons/bs";
import "../LubricationPlan/LubricationPlanForm.css"; // CSS bạn đang dùng
import { Link } from "react-router-dom";

export default function MaintenancePlanList() {
    const [search, setSearch] = useState("");

    // demo data
    const [plans] = useState([
        {
            id: 1,
            code: "KHBD-001",
            name: "Bảo dưỡng hệ thống bơm",
            system: "Hệ thống bơm",
            frequency: "Hàng tháng",
            status: "Đang hoạt động",
        },
        {
            id: 2,
            code: "KHBD-002",
            name: "Bảo dưỡng turbine",
            system: "Turbine",
            frequency: "Hàng quý",
            status: "Tạm dừng",
        },
    ]);

    const filtered = plans.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="data-table-wrapper">

            {/* Toolbar */}
            <div className="data-table-toolbar">
                <div className="data-table-count">
                    Tổng: {filtered.length} kế hoạch
                </div>



                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Button
                        as={Link}
                        to="/lubrication/plant/add"
                        size="sm"
                    >
                        <BsPlusCircle className="me-1" />
                        Thêm mới
                    </Button>
                    <BsSearch />
                    <Form.Control
                        size="sm"
                        placeholder="Tìm kiếm kế hoạch..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="data-table-scroll">
                <Table className="data-table" hover responsive>
                    <thead>
                    <tr>
                        <th>Mã</th>
                        <th>Tên kế hoạch</th>
                        <th>Hệ thống</th>
                        <th>Tần suất</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: "center" }}>Thao tác</th>
                    </tr>
                    </thead>

                    <tbody>
                    {filtered.map((plan) => (
                        <tr key={plan.id}>
                            <td>{plan.code}</td>
                            <td>{plan.name}</td>
                            <td>{plan.system}</td>
                            <td>{plan.frequency}</td>
                            <td>{plan.status}</td>

                            <td>
                                <div className="action-buttons">
                                    <Button variant="outline-primary" size="sm">
                                        <BsPencil />
                                    </Button>
                                    <Button variant="outline-danger" size="sm">
                                        <BsTrash />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}

                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                                Không có dữ liệu
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </div>

            {/* Pagination (UI placeholder theo CSS) */}
            <div className="data-table-pagination">
                <div className="data-table-pagination-info">
                    Hiển thị {filtered.length} bản ghi
                </div>

                <Pagination size="sm">
                    <Pagination.Prev />
                    <Pagination.Item active>1</Pagination.Item>
                    <Pagination.Item>2</Pagination.Item>
                    <Pagination.Next />
                </Pagination>
            </div>
        </div>
    );
}