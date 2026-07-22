import {useEffect, useState} from "react";
import {
    Table,
    Button,
    Form,
    Pagination,
    Modal,
    Row,
    Col,
    Badge
} from "react-bootstrap";

import {
    BsEye,
    // BsPencil,
    // BsTrash,
    BsSearch,
    BsPlusCircle,
    BsArrowClockwise
} from "react-icons/bs";

import {Link} from "react-router-dom";

import lubricationPlanService from "../../services/lubricationPlanService";

import "../LubricationPlan/LubricationPlanForm.css";


export default function MaintenancePlanList() {


    const [plans,setPlans] = useState([]);

    const [search,setSearch] = useState("");

    const [status,setStatus] = useState("");

    const [loading,setLoading] = useState(false);


    const [showDetail,setShowDetail] = useState(false);

    const [selectedPlan,setSelectedPlan] = useState(null);


    const [pagination,setPagination] = useState({
        page:0,
        size:10,
        totalPages:0,
        totalElements:0
    });



    useEffect(()=>{

        loadData();

    },[pagination.page]);



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

            setPagination(prev => ({
                ...prev,
                page,
                totalPages: res.totalPages,
                totalElements: res.totalElements
            }));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };



    const handleSearch = (e)=>{

        setSearch(e.target.value);

    };

    const handleSearchClick = () => {
        loadData(search, status, 0);
    };

    const handleResetSearch = async () => {

        setSearch("");
        setStatus("");

        await loadData("", "", 0);

    };



    const formatStatus=(status)=>{

        switch(status){

            case "NOT_LUBRICATED":
                return "Chưa bảo dưỡng";

            case "DUE_FOR_LUBRICATION":
                return "Đến hạn bảo dưỡng";

            case "DUE_SOON":
                return "Sắp đến hạn";

            case "LUBRICATED":
                return "Đã bảo dưỡng";

            case "OVERDUE":
                return "Quá hạn";

            default:
                return status;
        }

    };



    const getCycleName=(days)=>{

        switch(days){

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



    return (

        <div className="data-table-wrapper">


            {/* TOOLBAR */}
            <div
                className="data-table-toolbar"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    padding: "16px 20px",
                    background: "#fff",
                    borderRadius: "12px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}
            >

                {/* BÊN TRÁI */}
                <div>
                    <h6
                        style={{
                            margin: 0,
                            fontWeight: 600
                        }}
                    >
                        Danh sách kế hoạch bôi trơn
                    </h6>

                    <small className="text-muted">
                        Tổng cộng {pagination.totalElements} kế hoạch
                    </small>
                </div>

                {/* BÊN PHẢI */}
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap"
                    }}
                >

                    <Form.Control
                        size="sm"
                        placeholder="Mã kế hoạch, thiết bị..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "250px",
                            minWidth: "220px"
                        }}
                    />

                    <Form.Select
                        size="sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{
                            width: "180px"
                        }}
                    >
                        <option value="">
                            Tất cả trạng thái
                        </option>

                        <option value="NOT_LUBRICATED">
                            Chưa bảo dưỡng
                        </option>

                        <option value="DUE_FOR_LUBRICATION">
                            Đến hạn bảo dưỡng
                        </option>

                        <option value="DUE_SOON">
                            Sắp đến hạn
                        </option>

                        <option value="LUBRICATED">
                            Đã bảo dưỡng
                        </option>

                        <option value="OVERDUE">
                            Quá hạn
                        </option>
                    </Form.Select>

                    <Button
                        variant="success"
                        size="sm"
                        onClick={handleSearchClick}
                    >
                        <BsSearch className="me-1"/>
                        Tìm kiếm
                    </Button>

                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleResetSearch}
                    >
                        <BsArrowClockwise className="me-1"/>
                        Làm mới
                    </Button>

                    <Button
                        as={Link}
                        to="/lubrication/plant/add"
                        variant="primary"
                        size="sm"
                    >
                        <BsPlusCircle className="me-1"/>
                        Thêm mới
                    </Button>

                </div>

            </div>





            <div className="data-table-scroll">


                <Table
                    className="data-table"
                    hover
                    responsive
                >

                    <thead>
                    <tr>
                        <th>Mã kế hoạch</th>
                        <th>Thiết bị</th>
                        <th>Chu kỳ</th>
                        <th>Ngày tiếp theo</th>
                        <th>Vật tư</th>
                        <th>SL</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                    </thead>



                    <tbody>

                    {
                        loading && (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="text-center py-4"
                                >
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        )
                    }

                    {
                        plans.map(plan=>(

                            <tr key={plan.id}>


                                <td>
                                    {plan.lubricationCode}
                                </td>


                                <td>
                                    {plan.equipment?.name || "-"}
                                </td>





                                <td>
                                    {
                                        getCycleName(plan.cycleDays)
                                    }
                                </td>


                                <td>
                                    {plan.nextDueDate}
                                </td>


                                <td>
                                    {
                                        plan.consumable?.name || "-"
                                    }
                                </td>


                                <td>
                                    {plan.quantity}
                                </td>


                                <td>

                                    <Badge
                                        bg={
                                            plan.status==="LUBRICATED"
                                                ?"success"
                                                :
                                                plan.status==="OVERDUE"
                                                    ?"danger"
                                                    :
                                                    "warning"
                                        }
                                    >

                                        {
                                            formatStatus(plan.status)
                                        }

                                    </Badge>

                                </td>



                                <td>

                                    <div className="action-buttons">


                                        <Button

                                            size="sm"

                                            variant="outline-info"

                                            onClick={()=>{

                                                setSelectedPlan(plan);
                                                setShowDetail(true);

                                            }}

                                        >

                                            <BsEye/>

                                        </Button>


                                        {/*<Button*/}
                                        {/*    size="sm"*/}
                                        {/*    variant="outline-primary"*/}
                                        {/*>*/}

                                        {/*    <BsPencil/>*/}

                                        {/*</Button>*/}


                                        {/*<Button*/}
                                        {/*    size="sm"*/}
                                        {/*    variant="outline-danger"*/}
                                        {/*>*/}

                                        {/*    <BsTrash/>*/}

                                        {/*</Button>*/}


                                    </div>


                                </td>


                            </tr>

                        ))
                    }


                    </tbody>


                </Table>


            </div>

            <div className="data-table-pagination">


                <div className="data-table-pagination-info">

                    Hiển thị:

                    {" "}

                    {plans.length}

                    /

                    {pagination.totalElements}

                    {" "}
                    kế hoạch


                </div>



                <div
                    className="data-table-pagination"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "16px",
                        flexWrap: "wrap"
                    }}
                >

                    <div className="text-muted">
                        Hiển thị {plans.length} / {pagination.totalElements} bản ghi
                    </div>

                    <Pagination size="sm">


                        <Pagination.First

                            disabled={
                                pagination.page===0
                            }

                            onClick={()=>{

                                setPagination(prev=>({
                                    ...prev,
                                    page:0
                                }));

                            }}

                        />



                        <Pagination.Prev

                            disabled={
                                pagination.page===0
                            }

                            onClick={()=>{

                                setPagination(prev=>({
                                    ...prev,
                                    page:prev.page-1
                                }));

                            }}

                        />



                        {
                            Array.from(
                                {
                                    length:
                                    pagination.totalPages
                                }
                            )
                                .map((_,index)=>(

                                    <Pagination.Item

                                        key={index}

                                        active={
                                            pagination.page===index
                                        }

                                        onClick={()=>{

                                            setPagination(prev=>({
                                                ...prev,
                                                page:index
                                            }));

                                        }}

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

                            onClick={()=>{

                                setPagination(prev=>({
                                    ...prev,
                                    page:prev.page+1
                                }));

                            }}

                        />



                        <Pagination.Last

                            disabled={
                                pagination.page >=
                                pagination.totalPages-1
                            }

                            onClick={()=>{

                                setPagination(prev=>({
                                    ...prev,
                                    page:
                                        pagination.totalPages-1
                                }));

                            }}

                        />


                    </Pagination>

                </div>


            </div>



            {/* MODAL CHI TIẾT */}

            <Modal

                show={showDetail}

                onHide={()=>setShowDetail(false)}

                size="lg"

            >

                <Modal.Header closeButton>

                    <Modal.Title>

                        Chi tiết kế hoạch bôi trơn

                    </Modal.Title>

                </Modal.Header>



                <Modal.Body>

                    {selectedPlan && (

                        <>
                            {/* THÔNG TIN KẾ HOẠCH */}
                            <div
                                className="p-3 mb-3"
                                style={{
                                    background: "#f8f9fa",
                                    borderRadius: "12px",
                                    border: "1px solid #e9ecef"
                                }}
                            >
                                <h5 className="mb-3 text-primary">
                                    Thông tin kế hoạch
                                </h5>

                                <Row>
                                    <Col md={6}>
                                        <p>
                                            <strong>Mã kế hoạch:</strong><br />
                                            {selectedPlan.lubricationCode}
                                        </p>

                                        <p>
                                            <strong>Hệ thống:</strong><br />
                                            {selectedPlan.equipment?.system?.name || "-"}
                                        </p>

                                        <p>
                                            <strong>Thiết bị:</strong><br />
                                            {selectedPlan.equipment?.name || "-"}
                                        </p>
                                    </Col>

                                    <Col md={6}>
                                        <p>
                                            <strong>Mã thiết bị:</strong><br />
                                            {selectedPlan.equipment?.equipmentCode || "-"}
                                        </p>

                                        <p>
                                            <strong>Chu kỳ:</strong><br />
                                            {getCycleName(selectedPlan.cycleDays)}
                                        </p>

                                        <p>
                                            <strong>Ngày bảo dưỡng tiếp theo:</strong><br />
                                            {selectedPlan.nextDueDate}
                                        </p>

                                        <p>
                                            <strong>Trạng thái:</strong><br />

                                            <Badge
                                                bg={
                                                    selectedPlan.status === "LUBRICATED"
                                                        ? "success"
                                                        : selectedPlan.status === "OVERDUE"
                                                            ? "danger"
                                                            : "warning"
                                                }
                                            >
                                                {formatStatus(selectedPlan.status)}
                                            </Badge>
                                        </p>
                                    </Col>
                                </Row>
                            </div>

                            {/* THÔNG TIN VẬT TƯ */}
                            <div
                                className="p-3"
                                style={{
                                    background: "#f8f9fa",
                                    borderRadius: "12px",
                                    border: "1px solid #e9ecef"
                                }}
                            >
                                <h5 className="mb-3 text-success">
                                    Vật tư sử dụng
                                </h5>

                                <Row className="align-items-center">

                                    <Col md={4} className="text-center">

                                        <img
                                            src={
                                                selectedPlan.consumable?.imgPath ||
                                                "/images/no-image.png"
                                            }
                                            alt={
                                                selectedPlan.consumable?.name
                                            }
                                            style={{
                                                width: "220px",
                                                height: "220px",
                                                objectFit: "cover",
                                                borderRadius: "12px",
                                                border: "1px solid #dee2e6",
                                                boxShadow:
                                                    "0 2px 8px rgba(0,0,0,0.1)"
                                            }}
                                        />

                                    </Col>

                                    <Col md={8}>

                                        <Row>

                                            <Col md={6}>
                                                <p>
                                                    <strong>Mã vật tư:</strong><br />
                                                    {
                                                        selectedPlan.consumable?.consumableCode
                                                        || "-"
                                                    }
                                                </p>
                                            </Col>

                                            <Col md={6}>
                                                <p>
                                                    <strong>Số lượng:</strong><br />
                                                    {selectedPlan.quantity}
                                                </p>
                                            </Col>

                                        </Row>

                                        <p>
                                            <strong>Tên vật tư:</strong><br />
                                            {
                                                selectedPlan.consumable?.name
                                                || "-"
                                            }
                                        </p>

                                        <p>
                                            <strong>Đơn vị:</strong><br />
                                            {
                                                selectedPlan.consumable?.unit?.unitName
                                                || "-"
                                            }
                                        </p>

                                        <p>
                                            <strong>Trạng thái:</strong><br />

                                            <Badge
                                                bg={
                                                    selectedPlan.consumable?.status === "ACTIVE"
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {
                                                    selectedPlan.consumable?.status === "ACTIVE"
                                                        ? "Đang sử dụng"
                                                        : "Ngừng sử dụng"
                                                }
                                            </Badge>
                                        </p>

                                    </Col>

                                </Row>
                            </div>
                        </>
                    )}

                </Modal.Body>



                <Modal.Footer>


                    <Button

                        variant="secondary"

                        onClick={()=>setShowDetail(false)}

                    >

                        Đóng

                    </Button>


                </Modal.Footer>


            </Modal>



        </div>

    );

}