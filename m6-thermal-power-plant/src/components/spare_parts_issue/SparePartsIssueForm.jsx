import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Row, Col, Button } from "react-bootstrap";
import { PDFDownloadLink } from "@react-pdf/renderer";

import SparePartsIssuePDF from "../../pdf/SparePartsIssuePDF";

import {
  BsBoxSeam,
  BsClipboardCheck,
  BsPersonBadge,
  BsSave,
  BsArrowClockwise,
  BsXCircle,
  BsFileEarmarkPdf,
} from "react-icons/bs";

import "./SparePartsIssueForm.css";

const validationSchema = Yup.object({
  sparePartCode: Yup.string().required(
      "Mã phiếu không được để trống"
  ),

  workOrderId: Yup.string().required(
      "Vui lòng chọn lệnh công việc"
  ),

  issuedBy: Yup.string().required(
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
  sparePartCode: "PXVT-2026-001",

  technicalAssessmentId: "1",

  workOrderId: "1",

  issuedBy: "",

  issuedAt: "",

  items: [],
};

const UNITS = [
  "Cái",
  "Bộ",
  "Chiếc",
  "Kg",
  "Mét",
  "Lít",
  "Cuộn",
  "Hộp",
];

export default function SparePartsIssueForm({
                                              onSuccess,
                                              onCancel,
                                            }) {
  const [keyword, setKeyword] = useState("");

  const workOrders = [
    {
      id: 1,
      code: "WO-2026-001",
    },
    {
      id: 2,
      code: "WO-2026-002",
    },
  ];

  const technicalAssessments = [
    {
      id: 1,
      technicalCode: "DGKT-2026-001",
      assessorName: "Trần Văn B",
      result:
          "Động cơ bơm nước làm mát bị mòn vòng bi.",
      description:
          "Đề xuất thay vòng bi SKF 6205.",
    },
  ];

  const spareParts = [
    {
      id: 1,
      code: "VT-001",
      name: "Vòng bi SKF 6205",
    },
    {
      id: 2,
      code: "VT-002",
      name: "Động cơ ABB 5KW",
    },
    {
      id: 3,
      code: "VT-003",
      name: "Contactor Schneider LC1D18",
    },
  ];

  const employees = [
    {
      id: 1,
      fullName: "Nguyễn Văn A",
    },
    {
      id: 2,
      fullName: "Trần Văn B",
    },
  ];

  const filteredSpareParts =
      spareParts.filter(
          (item) =>
              item.code
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

  const handleSubmit = async (
          values,
          {setSubmitting, resetForm}
      ) => {
        try {
          console.log(values);
          onSuccess?.();

          resetForm();
        } finally {
          setSubmitting(false);
        }

      }
  ;

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
                        Mã phiếu
                      </label>

                      <Field
                          name="sparePartCode"
                          className="form-control"
                      />
                    </Col>

                    <Col md={4}>
                      <label className="form-label">
                        Lệnh công việc
                      </label>

                      <Field
                          as="select"
                          name="workOrderId"
                          className="form-select"
                      >
                        {workOrders.map(
                            (item) => (
                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                  {item.code}
                                </option>
                            )
                        )}
                      </Field>
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
                    <table className="table table-bordered table-hover">
                      <thead className="table-light">
                      <tr>
                        <th width="60">
                          Chọn
                        </th>
                        <th>Mã vật tư</th>
                        <th>Tên vật tư</th>
                      </tr>
                      </thead>

                      <tbody>
                      {filteredSpareParts.map(
                          (sp) => {
                            const checked =
                                values.items.some(
                                    (item) =>
                                        item.sparePartId.toString() ===
                                        sp.id.toString()
                                );

                            return (
                                <tr
                                    key={sp.id}
                                >
                                  <td className="text-center">
                                    <input
                                        type="checkbox"
                                        checked={
                                          checked
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                          if (
                                              e
                                                  .target
                                                  .checked
                                          ) {
                                            setFieldValue(
                                                "items",
                                                [
                                                  ...values.items,
                                                  {
                                                    sparePartId:
                                                        sp.id.toString(),
                                                    quantity: 1,
                                                    unit: "Cái",
                                                  },
                                                ]
                                            );
                                          } else {
                                            setFieldValue(
                                                "items",
                                                values.items.filter(
                                                    (
                                                        item
                                                    ) =>
                                                        item.sparePartId.toString() !==
                                                        sp.id.toString()
                                                )
                                            );
                                          }
                                        }}
                                    />
                                  </td>

                                  <td>
                                    {
                                      sp.code
                                    }
                                  </td>

                                  <td>
                                    {
                                      sp.name
                                    }
                                  </td>
                                </tr>
                            );
                          }
                      )}
                      </tbody>
                    </table>
                  </div>

                  <div className="form-section-title">
                    <BsClipboardCheck/>
                    Danh sách vật tư cấp phát
                  </div>

                  <div className="table-responsive mb-4">
                    <table className="table table-bordered align-middle">
                      <thead className="table-primary">
                      <tr>
                        <th>Mã VT</th>
                        <th>Tên vật tư</th>
                        <th width="120">
                          Số lượng
                        </th>
                        <th width="150">
                          Đơn vị
                        </th>
                        <th width="100">
                          Thao tác
                        </th>
                      </tr>
                      </thead>

                      <tbody>
                      {values.items.length ===
                          0 && (
                              <tr>
                                <td
                                    colSpan={
                                      5
                                    }
                                    className="text-center"
                                >
                                  Chưa chọn vật tư
                                </td>
                              </tr>
                          )}

                      {values.items.map(
                          (
                              item,
                              index
                          ) => {
                            const sparePart =
                                spareParts.find(
                                    (
                                        sp
                                    ) =>
                                        sp.id.toString() ===
                                        item.sparePartId.toString()
                                );

                            return (
                                <tr
                                    key={
                                      index
                                    }
                                >
                                  <td>
                                    {
                                      sparePart?.code
                                    }
                                  </td>

                                  <td>
                                    {
                                      sparePart?.name
                                    }
                                  </td>

                                  <td>
                                    <Field
                                        type="number"
                                        min="1"
                                        name={`items.${index}.quantity`}
                                        className="form-control"
                                    />
                                  </td>

                                  <td>
                                    <Field
                                        as="select"
                                        name={`items.${index}.unit`}
                                        className="form-select"
                                    >
                                      {UNITS.map(
                                          (
                                              unit
                                          ) => (
                                              <option
                                                  key={
                                                    unit
                                                  }
                                                  value={
                                                    unit
                                                  }
                                              >
                                                {
                                                  unit
                                                }
                                              </option>
                                          )
                                      )}
                                    </Field>
                                  </td>

                                  <td>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() =>
                                            setFieldValue(
                                                "items",
                                                values.items.filter(
                                                    (
                                                        _,
                                                        i
                                                    ) =>
                                                        i !==
                                                        index
                                                )
                                            )
                                        }
                                    >
                                      Xóa
                                    </Button>
                                  </td>
                                </tr>
                            );
                          }
                      )}
                      </tbody>
                    </table>
                  </div>

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
                          name="issuedBy"
                          className="form-select"
                      >
                        <option value="">
                          Chọn người yêu cầu
                        </option>

                        {employees.map(
                            (item) => (
                                <option
                                    key={
                                      item.id
                                    }
                                    value={
                                      item.id
                                    }
                                >
                                  {
                                    item.fullName
                                  }
                                </option>
                            )
                        )}
                      </Field>
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

                  <PDFDownloadLink
                      document={
                        <SparePartsIssuePDF
                            data={
                              values
                            }
                            workOrders={
                              workOrders
                            }
                            spareParts={
                              spareParts
                            }
                            employees={
                              employees
                            }
                            technicalAssessment={
                              technicalAssessments.find(
                                  (
                                      item
                                  ) =>
                                      item.id.toString() ===
                                      values.technicalAssessmentId
                              )
                            }
                        />
                      }
                      fileName={`${values.sparePartCode}.pdf`}
                  >
                    {({
                        loading,
                      }) => (
                        <Button
                            type="button"
                            variant="outline-primary"
                        >
                          <BsFileEarmarkPdf/>
                          {loading
                              ? "Đang tạo PDF..."
                              : "Xuất PDF"}
                        </Button>
                    )}
                  </PDFDownloadLink>

                  <Button
                      type="submit"
                      variant="primary"
                      disabled={
                        isSubmitting
                      }
                  >
                    <BsSave/>
                    Lưu phiếu
                  </Button>
                </div>
              </Form>
          )}
        </Formik>
      </div>

  );
}
