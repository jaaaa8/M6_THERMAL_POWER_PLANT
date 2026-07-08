import {
    Table,
    Button,
    Pagination,
} from "react-bootstrap";

import { toast } from "react-toastify";

import {
    BsEye,
    BsPlusCircle,
    BsUpload
} from "react-icons/bs";

import { Link } from "react-router-dom";

import "../common/DataTable.css";
import { useEffect, useState } from "react";
import {
    getAllTechnicalAssessments,
    uploadPdf,
} from "../../services/technicalAssessmentService";

export default function TechnicalAssessmentList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);

            const result =
                await getAllTechnicalAssessments();

            setData(result);
        } catch (error) {
            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Không thể tải dữ liệu"
            );
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);





    const handleUploadPdf = async (item, file) => {
        if (!file) return;

        try {
            console.log(item.id);
            const payload = {
                id: item.id, // hoặc item.id
            };

            await uploadPdf(payload, file);

            toast.success(
                "Upload file PDF thành công"
            );
            loadData();
        } catch (error) {
            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Upload PDF thất bại"
            );
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
                            <th>Tổng quan</th>
                            <th>Người đánh giá</th>
                            <th>Kết quả</th>
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

                                <td>{item.description}</td>

                                <td>
                                    {item.assessor.name ||
                                        "-"}
                                </td>

                                <td>
                                    {item.result}
                                </td>

                                <td>
                                    {new Date(item.createdAt).toLocaleString("vi-VN")}
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
                                                        item,
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