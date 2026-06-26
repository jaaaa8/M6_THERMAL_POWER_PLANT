import { Formik, Form, Field, FieldArray } from "formik";
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

  technicalAssessmentId: Yup.string().required(
    "Vui lòng chọn phiếu đánh giá"
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

  items: Yup.array()
    .of(
      Yup.object({
        sparePartId: Yup.string().required(
          "Chọn vật tư"
        ),

        quantity: Yup.number()
          .required("Nhập số lượng")
          .positive("Số lượng phải lớn hơn 0"),

        unit: Yup.string().required(
          "Nhập đơn vị tính"
        ),
      })
    )
    .min(1, "Phải có ít nhất 1 vật tư"),
});

const INITIAL_VALUES = {
  sparePartCode: "PXVT-2026-001",

  technicalAssessmentId: "1",

  workOrderId: "1",

  transactionType: "export",

  issuedBy: "",

  issuedAt: "",

  items: [
    {
      sparePartId: "",
      quantity: 1,
      unit: "Cái",
    },
  ],
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

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm }
  ) => {
    try {
      console.log(values);

      onSuccess?.();

      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spare-part-form-card">

      {/* HEADER */}
      <div className="spare-part-form-header">
        <div className="spare-part-form-header-icon">
          <BsBoxSeam />
        </div>

        <div className="spare-part-form-header-text">
          <h2>Phiếu Xuất Vật Tư</h2>

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
        }) => (
          <Form>

            <div className="spare-part-form-body">

              {/* THÔNG TIN PHIẾU */}
              <div className="form-section-title">
                <BsClipboardCheck />
                Thông tin phiếu xuất vật tư
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
                    {workOrders.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.code}
                      </option>
                    ))}
                  </Field>
                </Col>

              </Row>

              {/* DANH SÁCH VẬT TƯ */}
              <div className="form-section-title">
                <BsBoxSeam />
                Danh sách vật tư cấp phát
              </div>

              <FieldArray name="items">
                {({ push, remove }) => (
                  <>
                    {values.items.map(
                      (item, index) => (
                        <Row
                          key={index}
                          className="mb-3 align-items-center"
                        >
                          <Col md={5}>
                            <Field
                              as="select"
                              name={`items.${index}.sparePartId`}
                              className="form-select"
                            >
                              <option value="">
                                Chọn vật tư
                              </option>

                              {spareParts.map(
                                (sp) => (
                                  <option
                                    key={sp.id}
                                    value={sp.id}
                                  >
                                    {sp.code} - {sp.name}
                                  </option>
                                )
                              )}
                            </Field>
                          </Col>

                          <Col md={2}>
                            <Field
                              type="number"
                              min="1"
                              name={`items.${index}.quantity`}
                              className="form-control"
                            />
                          </Col>

                          <Col md={2}>
                            <Field
                                as="select"
                                name={`items.${index}.unit`}
                                className="form-select"
                            >
                              {UNITS.map((unit) => (
                                  <option
                                      key={unit}
                                      value={unit}
                                  >
                                    {unit}
                                  </option>
                              ))}
                            </Field>
                          </Col>

                          <Col md={3}>
                            <Button
                              type="button"
                              variant="outline-danger"
                              onClick={() =>
                                remove(index)
                              }
                              disabled={
                                values.items.length === 1
                              }
                            >
                              Xóa
                            </Button>
                          </Col>
                        </Row>
                      )
                    )}

                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={() =>
                        push({
                          sparePartId: "",
                          quantity: 1,
                          unit: "Cái",
                        })
                      }
                    >
                      + Thêm vật tư
                    </Button>
                  </>
                )}
              </FieldArray>

              {/* THÔNG TIN CẤP PHÁT */}
              <div className="form-section-title mt-4">
                <BsPersonBadge />
                Thông tin cấp phát
              </div>

              <Row>

                <Col md={6}>
                  <label className="form-label">
                    Người cấp phát
                  </label>

                  <Field
                    as="select"
                    name="issuedBy"
                    className="form-select"
                  >
                    <option value="">
                      Chọn người cấp
                    </option>

                    {employees.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.fullName}
                      </option>
                    ))}
                  </Field>
                </Col>

                <Col md={6}>
                  <label className="form-label">
                    Thời gian cấp phát
                  </label>

                  <Field
                    type="datetime-local"
                    name="issuedAt"
                    className="form-control"
                  />
                </Col>

              </Row>

            </div>

            {/* FOOTER */}
            <div className="spare-part-form-footer">

              {onCancel && (
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={onCancel}
                >
                  <BsXCircle />
                  Huỷ bỏ
                </Button>
              )}

              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => resetForm()}
              >
                <BsArrowClockwise />
                Đặt lại
              </Button>

              <PDFDownloadLink
                document={
                  <SparePartsIssuePDF
                    data={values}
                    workOrders={workOrders}
                    spareParts={spareParts}
                    employees={employees}
                    technicalAssessment={
                      technicalAssessments.find(
                        (item) =>
                          item.id.toString() ===
                          values.technicalAssessmentId
                      )
                    }
                  />
                }
                fileName={`${values.sparePartCode}.pdf`}
              >
                {({ loading }) => (
                  <Button
                    type="button"
                    variant="outline-primary"
                  >
                    <BsFileEarmarkPdf />
                    {loading
                      ? "Đang tạo PDF..."
                      : "Xuất PDF"}
                  </Button>
                )}
              </PDFDownloadLink>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                <BsSave />
                Lưu phiếu
              </Button>

            </div>

          </Form>
        )}
      </Formik>
    </div>
  );
}
