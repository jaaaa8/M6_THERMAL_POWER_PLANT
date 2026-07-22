import {
    Form,
    Row,
    Col, Button, Table, Pagination, Modal
} from "react-bootstrap";

import {
    getAllSystems
} from "../../services/equipment/systemService";

import {
    getBySystem
} from "../../services/equipment/equipmentService";

import { toast } from "react-toastify";

import {
    BsEye,
    BsPlusCircle,
    BsUpload,
    BsArrowClockwise
} from "react-icons/bs";
import StatusBadge from "../common/StatusBadge";

import { Link } from "react-router-dom";

import "../common/DataTable.css";
import { useEffect, useState } from "react";
import {
    getAllTechnicalAssessments,
    uploadPdf,
    getTechnicalAssessmentByCode,
    deletePdf
} from "../../services/technicalAssessmentService";
import "./TechnicalAssessmentList.css"

export default function TechnicalAssessmentList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [systems,setSystems] = useState([]);
    const [equipments,setEquipments] = useState([]);
    const [showModal,setShowModal] = useState(false);
    const [pagination,setPagination] = useState({
        page:0,
        size:10,
        totalPages:0,
        totalElements:0
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingPdf, setDeletingPdf] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const [detail,setDetail] = useState(null);

    const [loadingDetail,setLoadingDetail] = useState(false);


    const [filters,setFilters] = useState({
        technicalCode:"",
        systemId:"",
        equipmentId:"",
        status:""
    });

    const loadData = async()=>{

        try{

            setLoading(true);


            const params={
                page: pagination.page,
                size: pagination.size
            };


            if(filters.technicalCode)
                params.technicalCode =
                    filters.technicalCode;


            if(filters.equipmentId)
                params.equipmentId =
                    filters.equipmentId;


            if(filters.status)
                params.status =
                    filters.status;



            const result =
                await getAllTechnicalAssessments(params);


            console.log(result.content);
            setData(result.content || []);


            setPagination(prev=>({
                ...prev,
                totalPages: result.totalPages,
                totalElements: result.totalElements
            }));


        }
        catch(error){

            console.error(error);

            toast.error(
                "Không thể tải dữ liệu"
            );

        }
        finally{

            setLoading(false);

        }

    };

    useEffect(() => {
        loadData();
    }, [pagination.page]);

    useEffect(()=>{

        loadSystems();

    },[]);


    const handleClearFilters = async () => {

        const emptyFilters = {
            technicalCode: "",
            systemId: "",
            equipmentId: "",
            status: ""
        };

        setFilters(emptyFilters);
        setEquipments([]);

        const params = {
            page: 0,
            size: pagination.size
        };

        const result =
            await getAllTechnicalAssessments(params);

        setData(result.content || []);

        setPagination(prev => ({
            ...prev,
            page: 0,
            totalPages: result.totalPages,
            totalElements: result.totalElements
        }));
    };


    const loadSystems = async()=>{

        try{

            const res =
                await getAllSystems(
                    "",
                    "",
                    0,
                    100
                );

            setSystems(
                res.data.content || res.data
            );

        }catch(error){

            toast.error(
                "Không tải được danh sách hệ thống"
            );

        }

    };

    const handleSystemChange = async(e)=>{

        const systemId = e.target.value;


        setFilters({
            ...filters,
            systemId,
            equipmentId:""
        });


        if(systemId){

            const res =
                await getBySystem(systemId);


            setEquipments(
                res.data.content || res.data
            );

        }
        else{

            setEquipments([]);

        }

    };

    const changePage = (page)=>{

        if(page < 0) return;

        if(page >= pagination.totalPages)
            return;


        setPagination({
            ...pagination,
            page
        });

    };

    const handleView = async(item)=>{

        try{

            setLoadingDetail(true);


            const result =
                await getTechnicalAssessmentByCode(
                    item.technicalCode
                );


            setDetail(result);

            setShowModal(true);


        }catch(error){

            console.error(error);

            toast.error(
                "Không tải được chi tiết phiếu đánh giá"
            );

        }
        finally{

            setLoadingDetail(false);

        }

    };

    const renderStatus = (status) => {

        const statusMap = {

            PENDING: {
                status: "warning",
                label: "Chờ up phiếu"
            },

            COMPLETED: {
                status: "normal",
                label: "Đã hoàn thành"
            }

        };


        const config =
            statusMap[status]
            ||
            {
                status: "inactive",
                label: "Không xác định"
            };


        return (
            <StatusBadge
                status={config.status}
                label={config.label}
            />
        );

    };

    const handleUploadPdf = async (item, file) => {
        if (!file) return;

        try {

            await uploadPdf(
                item.id,
                file
            );

            toast.success(
                "Upload file PDF thành công"
            );

            loadData();

        } catch (error) {

            console.error(error);

            toast.error(
                error?.response?.data ||
                error?.message ||
                "Upload PDF thất bại"
            );
        }
    };

    const handleDeletePdf = async () => {

        if (!detail?.id) return;

        setShowDeleteModal(true);

    };
    const confirmDeletePdf = async () => {

        if (!detail?.id) return;

        try {

            setDeletingPdf(true);

            await deletePdf(detail.id);

            toast.success(
                "Xoá file PDF thành công"
            );

            const updatedDetail =
                await getTechnicalAssessmentByCode(
                    detail.technicalCode
                );

            setDetail(updatedDetail);

            loadData();

            setShowDeleteModal(false);

        } catch (error) {

            console.error(error);

            toast.error(
                error?.response?.data ||
                error?.message ||
                "Xoá PDF thất bại"
            );

        } finally {

            setDeletingPdf(false);

        }

    };

    return (
        <div className="card shadow-sm">

            {/* Toolbar */}
            <div className="data-table-toolbar">
                <div className="data-table-count">
                    Tổng số: {pagination.totalElements} phiếu đánh giá
                </div>

                <Link to="/repair/technical-assessment/add">
                    <Button size="sm">
                        <BsPlusCircle className="me-1" />
                        Thêm mới
                    </Button>
                </Link>
            </div>

            <div className="p-3 border-bottom">

                <Row className="g-2">


                    <Col md={3}>

                        <Form.Control
                            placeholder="Tìm theo mã phiếu"

                            value={filters.technicalCode}

                            onChange={(e)=>
                                setFilters({
                                    ...filters,
                                    technicalCode:e.target.value
                                })
                            }
                        />

                    </Col>



                    <Col md={3}>

                        <Form.Select

                            value={filters.systemId}

                            onChange={handleSystemChange}

                        >

                            <option value="">
                                -- Chọn hệ thống --
                            </option>


                            {
                                systems.map(item=>(

                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >

                                        {item.name}

                                    </option>

                                ))

                            }


                        </Form.Select>

                    </Col>




                    <Col md={2}>

                        <Form.Select

                            value={filters.equipmentId}

                            disabled={!filters.systemId}

                            onChange={(e)=>
                                setFilters({
                                    ...filters,
                                    equipmentId:e.target.value
                                })
                            }

                        >

                            <option value="">
                                -- Chọn thiết bị --
                            </option>


                            {

                                equipments.map(item=>(

                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >

                                        {item.name}

                                    </option>

                                ))

                            }


                        </Form.Select>

                    </Col>



                    <Col md={2}>


                        <Form.Select
                            value={filters.status}
                            onChange={(e)=>
                                setFilters({
                                    ...filters,
                                    status:e.target.value
                                })
                            }
                        >
                            <option value="">
                                -- Trạng thái --
                            </option>

                            <option value="PENDING">
                                Chờ up phiếu
                            </option>

                            <option value="COMPLETED">
                                Đã hoàn thành
                            </option>

                        </Form.Select>


                    </Col>




                    <Col md={2}>
                        <div className="d-flex gap-2">

                            <Button
                                className="flex-fill"
                                onClick={loadData}
                            >
                                Tìm
                            </Button>

                            <Button
                                variant="outline-secondary"
                                onClick={handleClearFilters}
                                title="Xóa bộ lọc"
                            >
                                <BsArrowClockwise />
                            </Button>

                        </div>
                    </Col>



                </Row>


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
                                    {item.description || "-"}
                                </td>

                                <td>
                                    {item.assessor?.employee.employeeName || "-"}
                                </td>

                                <td>
                                    {
                                        item.equipment?.name
                                        ||
                                        "-"
                                    }
                                </td>

                                <td>
                                    {renderStatus(item.status)}
                                </td>


                                <td>
                                    {
                                        item.createdAt
                                            ? new Date(item.createdAt)
                                                .toLocaleString("vi-VN")
                                            : "-"
                                    }
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

                                        <label
                                            className={`btn btn-sm m-0 ${
                                                item.status === "COMPLETED"
                                                    ? "btn-outline-secondary disabled"
                                                    : "btn-outline-success"
                                            }`}
                                            style={{
                                                pointerEvents:
                                                    item.status === "COMPLETED"
                                                        ? "none"
                                                        : "auto",
                                                opacity:
                                                    item.status === "COMPLETED"
                                                        ? 0.6
                                                        : 1,
                                            }}
                                        >
                                            <BsUpload />

                                            <input
                                                type="file"
                                                accept=".pdf"
                                                hidden
                                                disabled={item.status === "COMPLETED"}
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
                    Hiển thị
                    {
                        pagination.page * pagination.size + 1
                    }
                    -
                    {
                        Math.min(
                            (pagination.page+1)
                            *
                            pagination.size,
                            pagination.totalElements
                        )
                    }

                    trên {pagination.totalElements} bản ghi
                </div>

                <Pagination size="sm">

                    <Pagination.Prev
                        disabled={pagination.page===0}
                        onClick={()=>
                            changePage(
                                pagination.page-1
                            )
                        }
                    />


                    {
                        Array.from(
                            {
                                length:
                                pagination.totalPages
                            }
                        ).map((_,index)=>(

                            <Pagination.Item
                                key={index}
                                active={
                                    pagination.page===index
                                }
                                onClick={()=>
                                    changePage(index)
                                }
                            >
                                {index+1}
                            </Pagination.Item>

                        ))
                    }


                    <Pagination.Next
                        disabled={
                            pagination.page >=
                            pagination.totalPages-1
                        }
                        onClick={()=>
                            changePage(
                                pagination.page+1
                            )
                        }
                    />

                </Pagination>

            </div>
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <BsEye className="me-2 text-primary"/>
                        Chi tiết phiếu đánh giá kỹ thuật
                    </Modal.Title>
                </Modal.Header>


                <Modal.Body className="bg-light">

                    {
                        loadingDetail ?

                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"/>
                                <div className="mt-2">
                                    Đang tải dữ liệu...
                                </div>
                            </div>


                            :

                            detail && (

                                <>

                                    {/* Thông tin chung */}
                                    <div className="card shadow-sm mb-3">

                                        <div className="card-header fw-bold">
                                            Thông tin phiếu
                                        </div>


                                        <div className="card-body">

                                            <Row>

                                                <Col md={6} className="mb-3">

                                                    <label className="text-muted">
                                                        Mã phiếu
                                                    </label>

                                                    <div className="fw-bold text-primary">
                                                        {detail.technicalCode || "-"}
                                                    </div>

                                                </Col>


                                                <Col md={6} className="mb-3">

                                                    <label className="text-muted">
                                                        Trạng thái
                                                    </label>

                                                    <div>
                                                        {renderStatus(detail.status)}
                                                    </div>

                                                </Col>


                                                <Col md={6}>

                                                    <label className="text-muted">
                                                        Người đánh giá
                                                    </label>

                                                    <div className="fw-semibold">
                                                        {
                                                            detail.assessor?.username
                                                            ||
                                                            "-"
                                                        }
                                                    </div>

                                                </Col>


                                                <Col md={6}>

                                                    <label className="text-muted">
                                                        Ngày tạo
                                                    </label>

                                                    <div>
                                                        {
                                                            detail.createdAt
                                                                ?
                                                                new Date(detail.createdAt)
                                                                    .toLocaleString("vi-VN")
                                                                :
                                                                "-"
                                                        }
                                                    </div>

                                                </Col>


                                            </Row>

                                        </div>

                                    </div>



                                    {/* Thiết bị */}
                                    <div className="card shadow-sm mb-3">

                                        <div className="card-header fw-bold">
                                            Hệ thống & thiết bị
                                        </div>


                                        <div className="card-body">

                                            <Row>


                                                <Col md={6}
                                                     className="mb-3">

                                                    <label className="text-muted">
                                                        Hệ thống
                                                    </label>


                                                    {
                                                        detail.equipment?.system ?

                                                            <div>

                                                                <div>
                                                                    <b>Mã:</b>

                                                                    {" "}

                                                                    {
                                                                        detail.equipment.system.systemCode
                                                                    }

                                                                </div>


                                                                <div>
                                                                    <b>Tên:</b>

                                                                    {" "}

                                                                    {
                                                                        detail.equipment.system.name
                                                                    }

                                                                </div>

                                                            </div>

                                                            :
                                                            "-"
                                                    }


                                                </Col>




                                                <Col md={6}>


                                                    <label className="text-muted">
                                                        Thiết bị
                                                    </label>


                                                    {
                                                        detail.equipment ?

                                                            <div>

                                                                <div>
                                                                    <b>Mã:</b>

                                                                    {" "}

                                                                    {
                                                                        detail.equipment.equipmentCode
                                                                    }

                                                                </div>


                                                                <div>
                                                                    <b>Tên:</b>

                                                                    {" "}

                                                                    {
                                                                        detail.equipment.name
                                                                    }

                                                                </div>


                                                            </div>

                                                            :
                                                            "-"
                                                    }


                                                </Col>


                                            </Row>


                                        </div>


                                    </div>




                                    {/* Nội dung đánh giá */}
                                    <div className="card shadow-sm mb-3">


                                        <div className="card-header fw-bold">
                                            Nội dung đánh giá
                                        </div>


                                        <div className="card-body">


                                            <div className="mb-3">

                                                <label className="text-muted">
                                                    Tổng quan
                                                </label>


                                                <div className="border rounded p-2 bg-white">

                                                    {
                                                        detail.description
                                                        ||
                                                        "-"
                                                    }

                                                </div>


                                            </div>



                                            <div>


                                                <label className="text-muted">
                                                    Kết quả đánh giá
                                                </label>


                                                <div className="border rounded p-2 bg-white">

                                                    {
                                                        detail.result
                                                        ||
                                                        "-"
                                                    }

                                                </div>


                                            </div>


                                        </div>


                                    </div>





                                    {/* File đính kèm */}
                                    {
                                        detail.attachmentPath &&

                                        <div className="card shadow-sm mb-3">

                                            <div className="card-header fw-bold">
                                                Phiếu đánh giá PDF
                                            </div>


                                            <div className="card-body">

                                                <div className="d-flex gap-2">

                                                    <a
                                                        href={detail.attachmentPath}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn btn-outline-primary"
                                                    >
                                                        <BsUpload className="me-2" />
                                                        Xem file PDF
                                                    </a>

                                                    {
                                                        detail.status === "COMPLETED" && (

                                                            <Button
                                                                variant="outline-danger"
                                                                onClick={handleDeletePdf}
                                                            >
                                                                Xóa PDF
                                                            </Button>

                                                        )
                                                    }

                                                </div>

                                            </div>


                                        </div>

                                    }





                                    {/* Hình ảnh */}
                                    {
                                        detail.imgPath &&
                                        detail.imgPath.length > 0 && (

                                            <div className="card shadow-sm">

                                                <div className="card-header fw-bold">
                                                    Hình ảnh đính kèm ({detail.imgPath.length})
                                                </div>

                                                <div className="card-body">

                                                    <Row className="g-3">

                                                        {detail.imgPath.map((imageUrl, index) => (

                                                            <Col md={6} lg={4} key={index}>

                                                                <a
                                                                    href={imageUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >

                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={`assessment-${index}`}
                                                                        className="img-fluid rounded shadow-sm border"
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "220px",
                                                                            objectFit: "cover",
                                                                            cursor: "pointer"
                                                                        }}
                                                                        onClick={() => setPreviewImage(imageUrl)}
                                                                    />

                                                                </a>

                                                            </Col>

                                                        ))}

                                                    </Row>

                                                </div>

                                            </div>

                                        )
                                    }

                                </>

                            )

                    }


                </Modal.Body>


                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                    >
                        Đóng
                    </Button>

                </Modal.Footer>


            </Modal>
            <Modal
                show={!!previewImage}
                onHide={() => setPreviewImage(null)}
                size="xl"
                centered
            >
                <Modal.Body className="text-center p-2">
                    <img
                        src={previewImage}
                        alt=""
                        className="img-fluid"
                    />
                </Modal.Body>
            </Modal>
            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        Xác nhận xóa PDF
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    <p className="mb-0">
                        Bạn có chắc chắn muốn xóa file PDF của phiếu:
                    </p>

                    <strong className="text-primary">
                        {detail?.technicalCode}
                    </strong>

                    <p className="mt-2 text-danger">
                        Lưu ý: Sau khi xóa, file PDF sẽ không thể khôi phục.
                    </p>

                </Modal.Body>

                <Modal.Footer>

                    <Button
                        variant="secondary"
                        disabled={deletingPdf}
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Hủy
                    </Button>


                    <Button
                        variant="danger"
                        disabled={deletingPdf}
                        onClick={confirmDeletePdf}
                    >

                        {
                            deletingPdf
                                ?
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"/>
                                    Đang xóa...
                                </>
                                :
                                "Xóa PDF"
                        }

                    </Button>

                </Modal.Footer>

            </Modal>
        </div>
    );
}