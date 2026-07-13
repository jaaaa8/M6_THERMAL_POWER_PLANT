import { useState, useEffect  } from "react";
import { Formik, Form, Field, ErrorMessage  } from "formik";
import * as Yup from "yup";
import { Row, Col, Button, Modal  } from "react-bootstrap";
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
  BsFileEarmarkPdf, BsImage, BsUpcScan, BsRulers, Bs123, BsTrash, BsCartCheckFill,
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

  issuedAt: Yup.string().required(
      "Vui lòng chọn thời gian cấp phát"
  ),

  items: Yup.array().min(
      1,
      "Phải chọn ít nhất 1 vật tư"
  ),
});

const INITIAL_VALUES = {
  sparePartCode: "",

  workOrderId: "1",

    issueUsername: "",

  issuedAt: "",

  items: [],
};



export default function SparePartsIssueForm({
                                              onCancel,
                                            }) {
  const [keyword, setKeyword] = useState("");
    const navigate = useNavigate();

    const [workOrders, setWorkOrders] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zoomImage, setZoomImage] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [
                workOrderRes,
                sparePartRes
            ] = await Promise.all([
                workOrderService.getAll(),
                sparePartService.getAll(),
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
                sparePartRes?.data?.content ??
                sparePartRes?.data ??
                [];

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

            setSpareParts(
                Array.isArray(sparePartData)
                    ? sparePartData
                    : []
            );

            console.log("ACCOUNT RESPONSE", accountRes);
            console.log("ACCOUNT DATA", accountRes.data);
            console.log("FIRST ACCOUNT", accountRes.data[0]);
            console.table(accountRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };



  const filteredSpareParts =
      spareParts.filter(
          (item) =>
              item.sparePartCode
                  .toLowerCase()
                  .includes(
                      keyword.toLowerCase()
                  ) ||
              item.name
                  .toLowerCase()
                  .includes(
                      keyword.toLowerCase()
                  )
      );

    const downloadPdf = async (
        values,
        fileName
    ) => {
        const blob = await pdf(
            <SparePartsIssuePDF
                data={values}
                workOrders={workOrders}
                spareParts={spareParts}
                employees={accounts}
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
                issueUsername: values.issueUsername,
                issuedAt: values.issuedAt,
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

            /*
             * dùng dữ liệu trả về từ BE để render PDF
             */
            await downloadPdf(
                {
                    ...values,
                    sparePartCode,
                },
                sparePartCode
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
                    <Col md={6}>
                      <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập mã hoặc tên vật tư..."
                          value={keyword}
                          onChange={(e) =>
                              setKeyword(
                                  e.target.value
                              )
                          }
                      />
                    </Col>
                  </Row>

                  <div className="table-responsive mb-4">
                    <table className="table spare-table align-middle">
                      <thead className="table-light">
                      <tr>
                        <th width="60">Chọn</th>
                        <th width="100">Ảnh</th>
                        <th>Mã vật tư</th>
                        <th>Tên vật tư</th>
                        <th width="120">Đơn vị</th>
                      </tr>
                      </thead>

                      <tbody>
                      {filteredSpareParts.map((sp) => {
                        const checked = values.items.some(
                            (item) =>
                                item.sparePartId.toString() ===
                                sp.id.toString()
                        );
                          if (loading) {
                              return (
                                  <div className="text-center p-5">
                                      Đang tải dữ liệu...
                                  </div>
                              );
                          }

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
                                              quantity: 1,
                                              unit: sp.unitName || "Cái",
                                            },
                                        ]);
                                      } else {
                                        setFieldValue(
                                            "items",
                                            values.items.filter(
                                                (item) =>
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
                                          (sp.imgPath ? sp.imgPath.split('|').filter(Boolean)[0] : null) ||
                                          sp.imageUrl ||
                                          sp.image ||
                                          "/images/no-image.png"
                                      }
                                      alt={sp.name}
                                      className="spare-part-image"
                                      onClick={() => setZoomImage(
                                          (sp.imgPath ? sp.imgPath.split('|').filter(Boolean)[0] : null) ||
                                          sp.imageUrl || sp.image || "/images/no-image.png"
                                      )}
                                      onError={(e) => { e.target.src = "/images/no-image.png"; }}
                                  />
                              </td>

                              <td>{sp.sparePartCode || sp.code}</td>

                              <td>{sp.name}</td>

                              <td>
    <span className="unit-badge">
        {sp.unitName || "Cái"}
    </span>
                              </td>
                            </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>

                  <div className="selected-material-header">
                    <BsCartCheckFill />
                    <span>Danh sách vật tư xuất kho</span>
                  </div>

                  <div className="table-responsive mb-4">
                    <table className="table spare-table align-middle">
                      <thead className="selected-spare-head">
                      <tr>
                        <th>
                          <BsImage />
                          {" "}Ảnh
                        </th>
                        <th>
                          <BsUpcScan />
                          {" "}Mã VT
                        </th>
                        <th>
                          <BsBoxSeam />
                          {" "}Tên vật tư
                        </th>
                        <th>
                          <BsRulers />
                          {" "}Đơn vị
                        </th>
                        <th>
                          <Bs123 />
                          {" "}Số lượng
                        </th>
                        <th>
                          <BsTrash />
                          {" "}Xóa
                        </th>
                      </tr>
                      </thead>

                      <tbody>
                      {values.items.map((item, index) => {
                        const sparePart = spareParts.find(
                            sp => sp.id.toString() === item.sparePartId.toString()
                        );

                        return (
                            <tr key={index}>
                              <td>
                                <img
                                    src={
                                        (sparePart?.imgPath ? sparePart.imgPath.split('|').filter(Boolean)[0] : null) ||
                                        sparePart?.imageUrl ||
                                        sparePart?.image ||
                                        "/images/no-image.png"
                                    }
                                    alt={sparePart?.name}
                                    className="spare-part-image"
                                    onError={(e) => { e.target.src = "/images/no-image.png"; }}
                                />
                              </td>

                              <td>{sparePart?.sparePartCode || sparePart?.code}</td>

                              <td>{sparePart?.name}</td>

                              {/* ĐƠN VỊ */}
                              <td>
                                <span className="unit-badge">
                                    {sparePart?.unitName || "Cái"}
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
                              <td>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() =>
                                        setFieldValue(
                                            "items",
                                            values.items.filter((_, i) => i !== index)
                                        )
                                    }
                                >
                                  Xóa
                                </Button>
                              </td>
                            </tr>
                        );
                      })}
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

                    <Col md={6}>
                      <label className="form-label">
                        Thời gian yêu cầu
                      </label>

                        <Field
                            type="datetime-local"
                            name="issuedAt"
                            className="form-control"
                        />

                        <ErrorMessage
                            name="issuedAt"
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
