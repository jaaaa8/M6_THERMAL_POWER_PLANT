import { useState, useEffect  } from "react";
import { Formik, Form, Field, ErrorMessage  } from "formik";
import * as Yup from "yup";
import {Row, Col, Button, Modal, Pagination} from "react-bootstrap";
import { pdf } from "@react-pdf/renderer";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import SparePartsIssuePDF from "../../pdf/SparePartsIssuePDF";
import sparePartIssueService from "../../services/sparePartIssueService";
import { workOrderService } from "../../services/workOrderService";
import * as sparePartService from "../../services/sparePartService";

import {
  BsBoxSeam,
  BsClipboardCheck,
  BsPersonBadge,
  BsArrowClockwise,
  BsXCircle,
  BsFileEarmarkPdf, BsImage, BsUpcScan, BsRulers, Bs123, BsTrash, BsCartCheckFill
} from "react-icons/bs";

import "./SparePartsIssueForm.css";
import {accountService} from "../../services/hr/accountService.js";

const validationSchema = Yup.object({

  workOrderId: Yup.string().required(
      "Vui lòng chọn lệnh công việc"
  ),

    issueUsername: Yup.string().required(
      "Vui lòng chọn người cấp phát"
  ),

  items: Yup.array().min(
      1,
      "Phải chọn ít nhất 1 vật tư"
  ),
});

const INITIAL_VALUES = {
  sparePartCode: "",

  workOrderId: "",

    issueUsername: "",

  items: [],
};



export default function SparePartsIssueForm({
                                              onCancel,
                                            }) {
    const [filters, setFilters] = useState({
        code: "",
        name: "",
        manufacturer: "",
        price: "",
        status: "ACTIVE"
    });
    const navigate = useNavigate();

    const [workOrders, setWorkOrders] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zoomImage, setZoomImage] = useState(null);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalPages: 0,
        totalElements: 0
    });

    const [searchKey, setSearchKey] = useState(0);

    useEffect(() => {
        loadData();
    }, [pagination.page, searchKey]);

    const handleSearch = () => {
        setPagination(prev => ({
            ...prev,
            page: 0
        }));

        setSearchKey(prev => prev + 1);
    };
    const handleResetSearch = () => {

        setFilters({
            code: "",
            name: "",
            manufacturer: "",
            price: "",
            status: "ACTIVE"
        });

        setPagination(prev => ({
            ...prev,
            page: 0
        }));

        setSearchKey(prev => prev + 1);
    };

    const loadData = async () => {
        try {
            setLoading(true);

            const [
                workOrderRes,
                sparePartRes
            ] = await Promise.all([
                workOrderService.getAll(),
                sparePartService.search({
                    page: pagination.page,
                    size: pagination.size,
                    code: filters.code,
                    name: filters.name,
                    manufacturer: filters.manufacturer,
                    price: filters.price || undefined,
                    status: filters.status || undefined
                })
            ]);
            const accountRes = await accountService.getAll();
            setAccounts(accountRes.data);



            console.log(
                "Work Orders:",
                workOrderRes.data
            );


            console.log(
                "Spare Parts:",
                sparePartRes.data
            );

            const workOrderData =
                workOrderRes?.data?.content ??
                workOrderRes?.data ??
                [];

            const accountData =
                accountRes?.data?.content ??
                accountRes?.data ??
                [];

            const sparePartData =
                sparePartRes?.data?.content ?? [];

            setSpareParts(sparePartData);

            setPagination(prev => ({
                ...prev,
                totalPages: sparePartRes.data.totalPages,
                totalElements: sparePartRes.data.totalElements
            }));

            setWorkOrders(
                Array.isArray(workOrderData)
                    ? workOrderData
                    : []
            );

            setAccounts(
                Array.isArray(accountData)
                    ? accountData
                    : []
            );
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };



    const filteredSpareParts = spareParts;

    const downloadPdf = async (
        values,
        fileName,
        employee
    ) => {
        console.log("WORK ORDERS BEFORE PDF", workOrders);
        console.log("SPARE PARTS BEFORE PDF", spareParts);
        values.issuedBy = employee;
        const blob = await pdf(
            <SparePartsIssuePDF
                data={values}
                workOrders={workOrders}
                spareParts={spareParts}
            />
        ).toBlob();

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = `${fileName}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const handleSubmit = async (
        values,
        { setSubmitting }
    ) => {
        console.log("FORM VALUES", values);
        try {
            const payload = {
                workOrderId: Number(values.workOrderId),

                issuedBy: {
                    username: values.issueUsername,
                },

                issuedAt: new Date()
                    .toISOString()
                    .slice(0, 19),

                details: values.items.map(item => ({
                    sparePartId: Number(item.sparePartId),
                    quantity: Number(item.quantity),
                })),
            };

            console.table(payload);


            const savedIssue =
                await sparePartIssueService.create(payload);

            console.log("Saved Issue:", savedIssue);

            /*
             * lấy mã phiếu backend sinh
             */
            const sparePartCode =
                savedIssue.issueCode ||
                `SPARE_PART_${Date.now()}`;

            const employee = savedIssue.issuedBy;

            /*
             * dùng dữ liệu trả về từ BE để render PDF
             */
            await downloadPdf(
                {
                    ...values,
                    issuedAt: payload.issuedAt,
                    sparePartCode,
                    employee,
                },
                sparePartCode,
                employee,
            );

            toast.success(
                `Tạo phiếu ${sparePartCode} thành công`
            );

            setTimeout(() => {
                navigate("/repair/spare-parts-issue");
            }, 1500);
        } catch (error) {
            console.error("Status:", error.response?.status);

            console.error(
                "Backend Error:",
                JSON.stringify(error.response?.data, null, 2)
            );

            toast.error(
                error.response?.data?.message ||
                "Không thể tạo phiếu xuất vật tư"
            );
        }
        finally {
            setSubmitting(false);
        }
    };

  return (<div className="spare-part-form-card">
        <div className="spare-part-form-header">
          <div className="spare-part-form-header-icon"><BsBoxSeam/></div>
          <div className="spare-part-form-header-text">
            <h2>Phiếu Yêu Cầu Xuất Vật Tư</h2>

            <p>
              Cấp phát vật tư theo phiếu đánh giá kỹ thuật.
            </p>
          </div>
        </div>

        <Formik
            initialValues={INITIAL_VALUES}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
          {({
              values,
              isSubmitting,
              resetForm,
              setFieldValue,
            }) => (
              <Form>
                <div className="spare-part-form-body">
                  <div className="form-section-title">
                    <BsClipboardCheck/>
                    Thông tin phiếu
                  </div>

                  <Row className="mb-4">


                      <Col md={4}>
                          <label className="form-label">
                              Lệnh công việc
                          </label>

                          <Field
                              as="select"
                              name="workOrderId"
                              className="form-select"
                          >
                              <option value={""}>
                                  Chọn Phiếu Công Tác
                              </option>
                              {workOrders.map((workOrder) => (
                                  <option
                                      key={workOrder.id}
                                      value={workOrder.id}
                                  >
                                      {
                                          workOrder.workOrderCode ||
                                          workOrder.orderCode ||
                                          `WO-${workOrder.id}`
                                      }
                                  </option>
                              ))}
                          </Field>

                          <ErrorMessage
                              name="workOrderId"
                              component="div"
                              className="text-danger mt-1"
                          />
                      </Col>
                  </Row>

                  <div className="form-section-title">
                    <BsBoxSeam/>
                    Tìm kiếm vật tư
                  </div>

                    <Row className="mb-3">

                        <Col md={3}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Mã vật tư"
                                value={filters.code}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        code: e.target.value
                                    })
                                }
                            />
                        </Col>


                        <Col md={3}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Tên vật tư"
                                value={filters.name}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        name: e.target.value
                                    })
                                }
                            />
                        </Col>


                        <Col md={2}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nhà sản xuất"
                                value={filters.manufacturer}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        manufacturer: e.target.value
                                    })
                                }
                            />
                        </Col>


                        <Col md={2}>
                            <Button
                                className="w-100"
                                onClick={handleSearch}
                            >
                                Tìm kiếm
                            </Button>
                        </Col>

                        <Col md={2}>
                            <Button
                                variant="outline-secondary"
                                className="w-100"
                                onClick={handleResetSearch}
                            >
                                <BsArrowClockwise />
                                {" "}
                                Đặt lại
                            </Button>
                        </Col>

                    </Row>

                  <div className="table-responsive mb-4">
                    <table className="table spare-table align-middle">
                        <thead className="table-light">
                        <tr>
                            <th width="60">Chọn</th>
                            <th width="90">Ảnh</th>
                            <th width="140">Mã VT</th>
                            <th>Tên vật tư</th>
                            <th width="150">Nhà sản xuất</th>
                            <th width="120">Đơn vị</th>
                        </tr>
                        </thead>

                        <tbody>
                        {
                            loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredSpareParts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                filteredSpareParts.map((sp) => {

                                    const checked = values.items.some(
                                        item =>
                                            item.sparePartId.toString() ===
                                            sp.id.toString()
                                    );

                                    return (
                                        <tr key={sp.id}>
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFieldValue("items", [
                                                                ...values.items,
                                                                {
                                                                    sparePartId: sp.id.toString(),
                                                                    quantity: 1
                                                                }
                                                            ]);
                                                        } else {
                                                            setFieldValue(
                                                                "items",
                                                                values.items.filter(
                                                                    item =>
                                                                        item.sparePartId.toString() !==
                                                                        sp.id.toString()
                                                                )
                                                            );
                                                        }
                                                    }}
                                                />
                                            </td>

                                            <td className="text-center">
                                                <img
                                                    src={
                                                        sp.imgPath ||
                                                        sp.imageUrl ||
                                                        "/images/no-image.png"
                                                    }
                                                    alt={sp.name}
                                                    className="spare-part-image"
                                                />
                                            </td>

                                            <td>
                        <span className="fw-semibold text-primary">
                            {sp.sparePartCode || sp.code}
                        </span>
                                            </td>

                                            <td>
                                                <div className="fw-semibold">
                                                    {sp.name}
                                                </div>
                                            </td>

                                            <td>
                                                {sp.manufacturer || "-"}
                                            </td>

                                            <td>
                                                <td>
                                                    <span className="badge bg-info">
                                                        {sp.unitName || "-"}
                                                    </span>
                                                </td>
                                            </td>


                                        </tr>
                                    );
                                })
                            )
                        }
                        </tbody>
                    </table>
                  </div>
                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <div>
                            Hiển thị {spareParts.length} / {pagination.totalElements} vật tư
                        </div>

                        <Pagination size="sm">

                            <Pagination.Prev
                                disabled={pagination.page === 0}
                                onClick={() =>
                                    setPagination(prev => ({
                                        ...prev,
                                        page: prev.page - 1
                                    }))
                                }
                            />

                            {
                                Array.from({
                                    length: pagination.totalPages
                                }).map((_, index) => (
                                    <Pagination.Item
                                        key={index}
                                        active={index === pagination.page}
                                        onClick={() =>
                                            setPagination(prev => ({
                                                ...prev,
                                                page: index
                                            }))
                                        }
                                    >
                                        {index + 1}
                                    </Pagination.Item>
                                ))
                            }

                            <Pagination.Next
                                disabled={
                                    pagination.page >=
                                    pagination.totalPages - 1
                                }
                                onClick={() =>
                                    setPagination(prev => ({
                                        ...prev,
                                        page: prev.page + 1
                                    }))
                                }
                            />

                        </Pagination>

                    </div>

                  <div className="selected-material-header">
                    <BsCartCheckFill />
                    <span>Danh sách vật tư xuất kho</span>
                  </div>

                    <div className="table-responsive mb-4">
                        <table className="table spare-table align-middle">
                            <thead className="table-light">
                            <tr>
                                <th width="90">
                                    <BsImage />
                                    {" "}Ảnh
                                </th>

                                <th width="140">
                                    <BsUpcScan />
                                    {" "}Mã VT
                                </th>

                                <th>
                                    <BsBoxSeam />
                                    {" "}Tên vật tư
                                </th>

                                <th width="120">
                                    <BsRulers />
                                    {" "}Đơn vị
                                </th>

                                <th width="130">
                                    <Bs123 />
                                    {" "}Số lượng
                                </th>

                                <th width="100">
                                    <BsTrash />
                                    {" "}Xóa
                                </th>
                            </tr>
                            </thead>


                            <tbody>

                            {
                                values.items.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center py-4"
                                        >
                                            Chưa chọn vật tư
                                        </td>
                                    </tr>

                                ) : (

                                    values.items.map((item,index)=>{

                                        const sparePart = spareParts.find(
                                            sp =>
                                                sp.id.toString() ===
                                                item.sparePartId.toString()
                                        );


                                        return (

                                            <tr key={index}>

                                                {/* ẢNH */}
                                                <td className="text-center">

                                                    <img
                                                        src={
                                                            sparePart?.imgPath ||
                                                            "/images/no-image.png"
                                                        }
                                                        alt={
                                                            sparePart?.name
                                                        }
                                                        className="spare-part-image"
                                                    />

                                                </td>



                                                {/* MÃ VẬT TƯ */}
                                                <td>

                                <span className="fw-semibold text-primary">

                                    {
                                        sparePart?.sparePartCode ||
                                        "-"
                                    }

                                </span>

                                                </td>



                                                {/* TÊN */}
                                                <td>

                                                    <div className="fw-semibold">

                                                        {
                                                            sparePart?.name ||
                                                            "-"
                                                        }

                                                    </div>

                                                </td>



                                                {/* ĐƠN VỊ */}
                                                <td>

                                <span className="badge bg-info">

                                    {
                                        sparePart?.unitName ||
                                        "-"
                                    }

                                </span>

                                                </td>



                                                {/* SỐ LƯỢNG */}
                                                <td>

                                                    <Field
                                                        type="number"
                                                        min="1"
                                                        name={`items.${index}.quantity`}
                                                        className="form-control quantity-input"
                                                    />

                                                </td>



                                                {/* XÓA */}
                                                <td className="text-center">

                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() =>
                                                            setFieldValue(
                                                                "items",
                                                                values.items.filter(
                                                                    (_,i)=>i!==index
                                                                )
                                                            )
                                                        }
                                                    >
                                                        Xóa
                                                    </Button>

                                                </td>


                                            </tr>

                                        );

                                    })

                                )
                            }


                            </tbody>

                        </table>
                    </div>
                    <ErrorMessage
                        name="items"
                        component="div"
                        className="text-danger fw-bold mt-2"
                    />

                  <div className="form-section-title">
                    <BsPersonBadge/>
                    Thông tin cấp phát
                  </div>

                  <Row>
                      <Col md={6}>
                          <label className="form-label">
                              Người yêu cầu
                          </label>

                          <Field
                              as="select"
                              name="issueUsername"
                              className="form-select"
                          >
                              <option value="">
                                  Chọn người yêu cầu
                              </option>

                              {accounts.map(account => (
                                  <option
                                      key={account.username}
                                      value={account.username}
                                  >
                                      {account.username}
                                  </option>
                              ))}
                          </Field>

                          <ErrorMessage
                              name="issueUsername"
                              component="div"
                              className="text-danger mt-1"
                          />
                      </Col>


                  </Row>
                </div>

                <div className="spare-part-form-footer">
                  {onCancel && (
                      <Button
                          type="button"
                          variant="outline-secondary"
                          onClick={
                            onCancel
                          }
                      >
                        <BsXCircle/>
                        Huỷ bỏ
                      </Button>
                  )}

                  <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() =>
                          resetForm()
                      }
                  >
                    <BsArrowClockwise/>
                    Đặt lại
                  </Button>

                    <Button
                        type="submit"
                        variant="success"
                        disabled={isSubmitting}
                    >
                        <BsFileEarmarkPdf />

                        {" "}

                        {isSubmitting
                            ? "Đang xử lý..."
                            : "Xuất PDF & Lưu"}
                    </Button>
                </div>
              </Form>
          )}
        </Formik>
          <Modal
              show={!!zoomImage}
              onHide={() => setZoomImage(null)}
              centered
              size="lg"
          >
              <Modal.Body className="p-0 text-center">
                  <img
                      src={zoomImage}
                      alt="Xem ảnh"
                      style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                  />
              </Modal.Body>
          </Modal>
      </div>

  );
}
