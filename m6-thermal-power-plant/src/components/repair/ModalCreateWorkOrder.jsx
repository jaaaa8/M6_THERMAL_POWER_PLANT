import { useMemo, useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  BsClipboardData, BsPeopleFill, BsPersonPlus, BsTrash,
  BsSave, BsXCircle, BsCpu, BsFileEarmarkPlus,
} from 'react-icons/bs';
import StatusBadge from '../common/StatusBadge';
import './ModalCreateWorkOrder.css';

/* ============================================================
   Map mức độ → StatusBadge
   ============================================================ */
const MUC_DO_MAP = {
  danger: { label: 'Khẩn cấp', status: 'danger', pulse: true },
  warning: { label: 'Ưu tiên cao', status: 'warning' },
  normal: { label: 'Bình thường', status: 'normal' },
};

/* ============================================================
   VALIDATION SCHEMA — Formik + Yup
   ============================================================ */
const validationSchema = Yup.object({
  soPhieu: Yup.string().required('Số PCT không được để trống'),
  noiDung: Yup.string()
    .required('Nội dung công việc không được để trống')
    .min(5, 'Nội dung công việc quá ngắn'),
  diaDiem: Yup.string().required('Vui lòng nhập địa điểm làm việc'),
  thoiGianBatDau: Yup.string().required('Vui lòng chọn thời gian bắt đầu'),
  thoiGianKetThuc: Yup.string().required('Vui lòng chọn thời gian dự kiến kết thúc'),
  nguoiLanhDao: Yup.string().required('Vui lòng chọn người lãnh đạo công việc'),
  chiHuyTrucTiep: Yup.string().required('Vui lòng chọn chỉ huy trực tiếp'),
  nguoiGiamSatAT: Yup.string().required('Vui lòng chọn người giám sát an toàn'),
  nhanVienLamViec: Yup.array().min(1, 'Cần ít nhất 1 nhân viên làm việc'),
});

/**
 * ModalCreateWorkOrder — Tạo phiếu công tác (PCT) từ một Request.
 * (User story #40 — Quản đốc sửa chữa / Tổ trưởng)
 *
 * Thông tin thiết bị được lấy từ Request (chỉ đọc); người dùng bổ sung
 * người lãnh đạo công việc, chỉ huy trực tiếp, giám sát an toàn và nhân viên làm việc.
 *
 * @param {boolean}  props.show
 * @param {Function} props.onClose
 * @param {object}   props.request - Request nguồn
 * @param {Array}    props.nhanVienOptions - Danh sách nhân viên (mock)
 * @param {Function} props.onCreated - (request, pct) => void
 */
export default function ModalCreateWorkOrder({
  show,
  onClose,
  request,
  nhanVienOptions = [],
  onCreated,
}) {
  // Nhân viên đang chọn ở ô "thêm nhân viên làm việc"
  const [selectedNV, setSelectedNV] = useState('');

  const mucDo = MUC_DO_MAP[request?.mucDo] || MUC_DO_MAP.normal;

  const initialValues = useMemo(
    () => ({
      soPhieu: `PCT-${new Date().getFullYear()}-${String(
          // eslint-disable-next-line react-hooks/purity
        Math.floor(Math.random() * 9000) + 1000
      )}`,
      noiDung: request
        ? `Sửa chữa, khắc phục sự cố thiết bị ${request.thietBi} (${request.maKKS}). ${request.moTa || ''}`.trim()
        : '',
      diaDiem: request?.heThong || '',
      thoiGianBatDau: '',
      thoiGianKetThuc: '',
      nguoiLanhDao: '',
      chiHuyTrucTiep: '',
      nguoiGiamSatAT: '',
      nhanVienLamViec: [],
    }),
    [request]
  );

  if (!request) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="lg" scrollable>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={(values, { setSubmitting }) => {
          // UI-only: không gọi service, chỉ thông báo & trả dữ liệu lên parent
          onCreated?.(request, values);
          toast.success(`Đã tạo phiếu công tác ${values.soPhieu}`);
          setSubmitting(false);
          setSelectedNV('');
          onClose?.();
        }}
      >
        {({ values, touched, errors, isSubmitting, setFieldValue }) => {
          const addNhanVien = () => {
            if (!selectedNV) return;
            if (values.nhanVienLamViec.some((nv) => nv.id === selectedNV)) {
              toast.info('Nhân viên đã có trong danh sách');
              return;
            }
            const nv = nhanVienOptions.find((n) => n.id === selectedNV);
            if (nv) {
              setFieldValue('nhanVienLamViec', [...values.nhanVienLamViec, nv]);
              setSelectedNV('');
            }
          };

          const removeNhanVien = (id) => {
            setFieldValue(
              'nhanVienLamViec',
              values.nhanVienLamViec.filter((nv) => nv.id !== id)
            );
          };

          return (
            <Form noValidate>
              <Modal.Header closeButton>
                <Modal.Title className="pct-modal-title">
                  <span className="pct-modal-title-icon">
                    <BsFileEarmarkPlus />
                  </span>
                  <div>
                    <span className="pct-modal-title-main">Tạo Phiếu Công tác</span>
                    <span className="pct-modal-title-sub">
                      Từ yêu cầu <strong>{request.maRequest}</strong>
                    </span>
                  </div>
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                {/* ===== SECTION: THÔNG TIN THIẾT BỊ (từ Request) ===== */}
                <div className="pct-section-title">
                  <BsCpu />
                  Thông tin thiết bị (lấy từ yêu cầu)
                </div>

                <div className="pct-request-card">
                  <div className="pct-info-grid">
                    <InfoItem label="Mã yêu cầu" value={request.maRequest} mono />
                    <InfoItem label="Thiết bị" value={request.thietBi} />
                    <InfoItem label="Mã KKS" value={request.maKKS} mono />
                    <InfoItem label="Hệ thống" value={request.heThong} />
                    <InfoItem label="Người yêu cầu" value={request.nguoiYeuCau} />
                    <div className="pct-info-item">
                      <span className="pct-info-label">Mức độ</span>
                      <span className="pct-info-value">
                        <StatusBadge status={mucDo.status} label={mucDo.label} pulse={mucDo.pulse} />
                      </span>
                    </div>
                  </div>
                  <div className="pct-info-item pct-info-full">
                    <span className="pct-info-label">Mô tả hư hỏng</span>
                    <span className="pct-info-value">{request.moTa}</span>
                  </div>
                </div>

                {/* ===== SECTION: NỘI DUNG PHIẾU CÔNG TÁC ===== */}
                <div className="pct-section-title mt-4">
                  <BsClipboardData />
                  Nội dung phiếu công tác
                </div>

                <Row className="mb-3">
                  <Col md={5}>
                    <label htmlFor="pct-soPhieu" className="form-label">
                      Số PCT <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      id="pct-soPhieu"
                      name="soPhieu"
                      type="text"
                      className={`form-control font-mono ${
                        touched.soPhieu && errors.soPhieu ? 'is-invalid' : ''
                      }`}
                    />
                    <ErrorMessage name="soPhieu" component="div" className="invalid-feedback" />
                  </Col>
                  <Col md={7}>
                    <label htmlFor="pct-diaDiem" className="form-label">
                      Địa điểm làm việc <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      id="pct-diaDiem"
                      name="diaDiem"
                      type="text"
                      placeholder="VD: Khu vực bơm cấp nước thô — Cao trình 0m"
                      className={`form-control ${
                        touched.diaDiem && errors.diaDiem ? 'is-invalid' : ''
                      }`}
                    />
                    <ErrorMessage name="diaDiem" component="div" className="invalid-feedback" />
                  </Col>
                </Row>

                <div className="mb-3">
                  <label htmlFor="pct-noiDung" className="form-label">
                    Nội dung công việc <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    as="textarea"
                    id="pct-noiDung"
                    name="noiDung"
                    rows={3}
                    className={`form-control ${
                      touched.noiDung && errors.noiDung ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage name="noiDung" component="div" className="invalid-feedback" />
                </div>

                <Row className="mb-3">
                  <Col md={6}>
                    <label htmlFor="pct-thoiGianBatDau" className="form-label">
                      Thời gian bắt đầu <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      id="pct-thoiGianBatDau"
                      name="thoiGianBatDau"
                      type="datetime-local"
                      className={`form-control ${
                        touched.thoiGianBatDau && errors.thoiGianBatDau ? 'is-invalid' : ''
                      }`}
                    />
                    <ErrorMessage name="thoiGianBatDau" component="div" className="invalid-feedback" />
                  </Col>
                  <Col md={6}>
                    <label htmlFor="pct-thoiGianKetThuc" className="form-label">
                      Dự kiến kết thúc <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      id="pct-thoiGianKetThuc"
                      name="thoiGianKetThuc"
                      type="datetime-local"
                      className={`form-control ${
                        touched.thoiGianKetThuc && errors.thoiGianKetThuc ? 'is-invalid' : ''
                      }`}
                    />
                    <ErrorMessage name="thoiGianKetThuc" component="div" className="invalid-feedback" />
                  </Col>
                </Row>

                {/* ===== SECTION: NHÂN SỰ ===== */}
                <div className="pct-section-title mt-4">
                  <BsPeopleFill />
                  Nhân sự thực hiện
                </div>

                <Row className="mb-3">
                  <Col md={4}>
                    <label htmlFor="pct-nguoiLanhDao" className="form-label">
                      Người lãnh đạo công việc <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      as="select"
                      id="pct-nguoiLanhDao"
                      name="nguoiLanhDao"
                      className={`form-select ${
                        touched.nguoiLanhDao && errors.nguoiLanhDao ? 'is-invalid' : ''
                      }`}
                    >
                      <option value="">— Chọn —</option>
                      {nhanVienOptions.map((nv) => (
                        <option key={nv.id} value={nv.id}>
                          {nv.hoTen} · {nv.chucVu}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="nguoiLanhDao" component="div" className="invalid-feedback" />
                  </Col>
                  <Col md={4}>
                    <label htmlFor="pct-chiHuyTrucTiep" className="form-label">
                      Chỉ huy trực tiếp <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      as="select"
                      id="pct-chiHuyTrucTiep"
                      name="chiHuyTrucTiep"
                      className={`form-select ${
                        touched.chiHuyTrucTiep && errors.chiHuyTrucTiep ? 'is-invalid' : ''
                      }`}
                    >
                      <option value="">— Chọn —</option>
                      {nhanVienOptions.map((nv) => (
                        <option key={nv.id} value={nv.id}>
                          {nv.hoTen} · {nv.chucVu}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="chiHuyTrucTiep" component="div" className="invalid-feedback" />
                  </Col>
                  <Col md={4}>
                    <label htmlFor="pct-nguoiGiamSatAT" className="form-label">
                      Người giám sát an toàn <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      as="select"
                      id="pct-nguoiGiamSatAT"
                      name="nguoiGiamSatAT"
                      className={`form-select ${
                        touched.nguoiGiamSatAT && errors.nguoiGiamSatAT ? 'is-invalid' : ''
                      }`}
                    >
                      <option value="">— Chọn —</option>
                      {nhanVienOptions.map((nv) => (
                        <option key={nv.id} value={nv.id}>
                          {nv.hoTen} · {nv.chucVu}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="nguoiGiamSatAT" component="div" className="invalid-feedback" />
                  </Col>
                </Row>

                {/* --- Nhân viên làm việc (nhiều người) --- */}
                <div className="mb-2">
                  <label className="form-label">
                    Nhân viên làm việc <span className="required-asterisk">*</span>
                  </label>
                  <div className="pct-add-nv">
                    <select
                      className="form-select"
                      value={selectedNV}
                      onChange={(e) => setSelectedNV(e.target.value)}
                      aria-label="Chọn nhân viên làm việc"
                    >
                      <option value="">— Chọn nhân viên để thêm —</option>
                      {nhanVienOptions
                        .filter((nv) => !values.nhanVienLamViec.some((s) => s.id === nv.id))
                        .map((nv) => (
                          <option key={nv.id} value={nv.id}>
                            {nv.hoTen} · {nv.chucVu}
                          </option>
                        ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={addNhanVien}
                      disabled={!selectedNV}
                    >
                      <BsPersonPlus /> Thêm
                    </Button>
                  </div>

                  {touched.nhanVienLamViec && errors.nhanVienLamViec && (
                    <div className="invalid-feedback d-block">{errors.nhanVienLamViec}</div>
                  )}

                  {values.nhanVienLamViec.length > 0 && (
                    <div className="pct-nv-list">
                      {values.nhanVienLamViec.map((nv, idx) => (
                        <div key={nv.id} className="pct-nv-chip">
                          <span className="pct-nv-chip-index">{idx + 1}</span>
                          <span className="pct-nv-chip-info">
                            <strong>{nv.hoTen}</strong>
                            <span>{nv.chucVu}</span>
                          </span>
                          <button
                            type="button"
                            className="pct-nv-chip-remove"
                            onClick={() => removeNhanVien(nv.id)}
                            title="Xoá khỏi danh sách"
                          >
                            <BsTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
                  <BsXCircle /> Huỷ bỏ
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  <BsSave /> {isSubmitting ? 'Đang lưu...' : 'Tạo phiếu công tác'}
                </Button>
              </Modal.Footer>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
}

/* --- Item hiển thị thông tin chỉ đọc --- */
function InfoItem({ label, value, mono }) {
  return (
    <div className="pct-info-item">
      <span className="pct-info-label">{label}</span>
      <span className={`pct-info-value ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}
