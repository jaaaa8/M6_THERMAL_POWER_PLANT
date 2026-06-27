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
import { workOrderService, AVAILABLE_WORKERS } from '../../services/workOrderService';
import { repairRequestService, PRIORITY_LABEL, PRIORITY_COLOR } from '../../services/repairRequestService';
import './CreateWorkOrderModal.css';

const validationSchema = Yup.object({
  maPhieu: Yup.string().required('Số phiếu không được để trống'),
  noiDung: Yup.string()
    .required('Nội dung công việc không được để trống')
    .min(5, 'Nội dung công việc quá ngắn'),
  diaDiem: Yup.string().required('Vui lòng nhập địa điểm làm việc'),
  thoiGianBatDau: Yup.string().required('Vui lòng chọn thời gian bắt đầu'),
  thoiGianKetThuc: Yup.string().required('Vui lòng chọn thời gian dự kiến kết thúc'),
  nguoiLanhDao: Yup.string().required('Vui lòng chọn người lãnh đạo công việc'),
  chiHuyTrucTiep: Yup.string().required('Vui lòng chọn chỉ huy trực tiếp'),
  nguoiGiamSatAT: Yup.string().required('Vui lòng chọn người giám sát an toàn'),
  nhanVienLamViec: Yup.array().min(1, 'Cần ít nhất 1 nhân viên thực hiện'),
});

const findWorker = (id) => AVAILABLE_WORKERS.find((w) => String(w.id) === String(id));
const workerLabel = (id) => {
  const w = findWorker(id);
  return w ? `${w.hoTen} · ${w.chucVu}` : '—';
};

export default function CreateWorkOrderModal({ show, onClose, request, onCreated }) {
  const [selectedNV, setSelectedNV] = useState('');

  const initialValues = useMemo(
    () => ({
      // Gợi ý mã phiếu theo năm + ID yêu cầu (user vẫn có thể sửa lại)
      maPhieu: `PCT-${new Date().getFullYear()}-${String(request?.id ?? '').padStart(3, '0')}`,
      noiDung: request
        ? `Sửa chữa, khắc phục sự cố thiết bị ${request.equipmentName} (${request.kksCode}). ${request.issueDescription || ''}`.trim()
        : '',
      diaDiem: '',
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

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const dto = {
        maPhieu: values.maPhieu,
        noiDung: values.noiDung,
        diaDiem: values.diaDiem,
        thoiGianBatDau: values.thoiGianBatDau,
        thoiGianKetThuc: values.thoiGianKetThuc,
        toTruong: workerLabel(values.nguoiLanhDao),
        nguoiChiHuy: workerLabel(values.chiHuyTrucTiep),
        nguoiGiamSat: workerLabel(values.nguoiGiamSatAT),
        thanhVienDuKien: values.nhanVienLamViec.map((nv) => ({
          hoTen: nv.hoTen,
          chucVu: nv.chucVu,
        })),
      };
      const res = await workOrderService.createFromRequest(request, dto);

      // Yêu cầu phải đang DA_DUYET mới chuyển sang DANG_XU_LY; nếu lệch, bỏ qua lỗi.
      try {
        await repairRequestService.markAsProcessing(request.id);
      } catch {
        // Trạng thái không phù hợp — không chặn việc tạo PCT
      }

      toast.success(`Đã tạo phiếu công tác ${res.data.maPhieu}`);
      resetForm();
      setSelectedNV('');
      onCreated?.(res.data);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo phiếu công tác');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" scrollable>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, touched, errors, isSubmitting, setFieldValue }) => {
          const addNhanVien = () => {
            if (!selectedNV) return;
            if (values.nhanVienLamViec.some((nv) => String(nv.id) === String(selectedNV))) {
              toast.info('Nhân viên đã có trong danh sách');
              return;
            }
            const nv = findWorker(selectedNV);
            if (nv) {
              setFieldValue('nhanVienLamViec', [...values.nhanVienLamViec, nv]);
              setSelectedNV('');
            }
          };

          const removeNhanVien = (id) => {
            setFieldValue(
              'nhanVienLamViec',
              values.nhanVienLamViec.filter((nv) => String(nv.id) !== String(id))
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
                      Từ yêu cầu <strong>{request.kksCode}</strong> — {request.equipmentName}
                    </span>
                  </div>
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                {/* ===== Thông tin thiết bị (chỉ đọc, từ yêu cầu) ===== */}
                <div className="pct-section-title">
                  <BsCpu />
                  Thông tin thiết bị (lấy từ yêu cầu)
                </div>

                <div className="pct-request-card">
                  <div className="pct-info-grid">
                    <InfoItem label="Mã KKS" value={request.kksCode} mono />
                    <InfoItem label="Thiết bị" value={request.equipmentName} />
                    <div className="pct-info-item">
                      <span className="pct-info-label">Mức ưu tiên</span>
                      <span className="pct-info-value">
                        <span
                          className="pct-priority-tag"
                          style={{ '--priority-color': PRIORITY_COLOR[request.priority] }}
                        >
                          {PRIORITY_LABEL[request.priority]}
                        </span>
                      </span>
                    </div>
                    <InfoItem label="Người tạo" value={request.createdBy} />
                    <InfoItem
                      label="Trạng thái"
                      value={<StatusBadge status="info" label="Đã duyệt" />}
                    />
                  </div>
                  <div className="pct-info-item pct-info-full">
                    <span className="pct-info-label">Mô tả sự cố</span>
                    <span className="pct-info-value">{request.issueDescription}</span>
                  </div>
                </div>

                {/* ===== Nội dung PCT ===== */}
                <div className="pct-section-title mt-4">
                  <BsClipboardData />
                  Nội dung phiếu công tác
                </div>

                <Row className="mb-3">
                  <Col md={5}>
                    <label htmlFor="pct-maPhieu" className="form-label">
                      Số PCT <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      id="pct-maPhieu"
                      name="maPhieu"
                      type="text"
                      className={`form-control font-mono ${
                        touched.maPhieu && errors.maPhieu ? 'is-invalid' : ''
                      }`}
                    />
                    <ErrorMessage name="maPhieu" component="div" className="invalid-feedback" />
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

                {/* ===== Nhân sự ===== */}
                <div className="pct-section-title mt-4">
                  <BsPeopleFill />
                  Nhân sự thực hiện
                </div>

                <Row className="mb-3">
                  <Col md={4}>
                    <label htmlFor="pct-nguoiLanhDao" className="form-label">
                      Tổ trưởng / Người lãnh đạo <span className="required-asterisk">*</span>
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
                      {AVAILABLE_WORKERS.map((nv) => (
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
                      {AVAILABLE_WORKERS.map((nv) => (
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
                      {AVAILABLE_WORKERS.map((nv) => (
                        <option key={nv.id} value={nv.id}>
                          {nv.hoTen} · {nv.chucVu}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="nguoiGiamSatAT" component="div" className="invalid-feedback" />
                  </Col>
                </Row>

                {/* --- Đội thực hiện dự kiến --- */}
                <div className="mb-2">
                  <label className="form-label">
                    Đội thực hiện dự kiến <span className="required-asterisk">*</span>
                  </label>
                  <div className="pct-add-nv">
                    <select
                      className="form-select"
                      value={selectedNV}
                      onChange={(e) => setSelectedNV(e.target.value)}
                      aria-label="Chọn nhân viên để thêm"
                    >
                      <option value="">— Chọn nhân viên để thêm —</option>
                      {AVAILABLE_WORKERS
                        .filter((nv) => !values.nhanVienLamViec.some((s) => String(s.id) === String(nv.id)))
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

function InfoItem({ label, value, mono }) {
  return (
    <div className="pct-info-item">
      <span className="pct-info-label">{label}</span>
      <span className={`pct-info-value ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}
