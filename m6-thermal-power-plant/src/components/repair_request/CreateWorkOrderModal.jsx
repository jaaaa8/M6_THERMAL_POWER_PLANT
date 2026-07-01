import { useMemo, useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  BsPeopleFill, BsPersonPlus, BsTrash,
  BsSave, BsXCircle, BsCpu, BsFileEarmarkPlus,
} from 'react-icons/bs';
import { workOrderService } from '../../services/workOrderService';
import StatusBadge from '../common/StatusBadge';
import './CreateWorkOrderModal.css';

/* ============================================================
   Map mức độ → StatusBadge
   ============================================================ */
const MUC_DO_MAP = {
  danger: { label: 'Khẩn cấp', status: 'danger', pulse: true },
  warning: { label: 'Ưu tiên cao', status: 'warning' },
  normal: { label: 'Bình thường', status: 'normal' },
  EMERGENCY: { label: 'Khẩn cấp', status: 'danger', pulse: true },
  HIGH: { label: 'Ưu tiên cao', status: 'warning' },
  LOW: { label: 'Bình thường', status: 'normal' },
  NORMAL: { label: 'Bình thường', status: 'normal' },
};

/* ============================================================
   VALIDATION — khớp với CreateWorkOrderRequest DTO backend
   Các trường @NotNull ở backend: leaderId, directSupervisorId,
   safetySupervisorId, startTime → bắt buộc ở đây.
   ============================================================ */
const validationSchema = Yup.object({
  leaderId: Yup.number()
    .typeError('Vui lòng chọn người lãnh đạo')
    .required('Vui lòng chọn người lãnh đạo công việc'),
  directSupervisorId: Yup.number()
    .typeError('Vui lòng chọn chỉ huy trực tiếp')
    .required('Vui lòng chọn chỉ huy trực tiếp'),
  safetySupervisorId: Yup.number()
    .typeError('Vui lòng chọn người giám sát an toàn')
    .required('Vui lòng chọn người giám sát an toàn'),
  startTime: Yup.string()
    .required('Vui lòng nhập thời gian bắt đầu'),
  expectedEndTime: Yup.string().nullable(),
});

/**
 * ModalCreateWorkOrder — Tạo phiếu công tác (PCT) từ một Request.
 * (User story #40 — Quản đốc sửa chữa / Tổ trưởng)
 *
 * Gửi POST /api/maintenance/work-orders với body khớp CreateWorkOrderRequest DTO.
 * orderCode được sinh tự động bởi backend — KHÔNG có ô nhập.
 * Nội dung công việc lấy từ incidentDescription của request — KHÔNG có ô nhập riêng.
 *
 * @param {boolean}  props.show
 * @param {Function} props.onClose
 * @param {object}   props.request - Request nguồn (dạng RepairRequestDTO từ API)
 * @param {Array}    props.employees - Danh sách nhân viên [{id, fullName, position: {name}}]
 * @param {Function} props.onCreated - (request, createdWorkOrder) => void
 */
export default function ModalCreateWorkOrder({
  show,
  onClose,
  request,
  employees = [],
  onCreated,
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Chuẩn bị danh sách employee để hiển thị trong select
  const employeeList = useMemo(() => {
    // Ensure employees is an array
    const empArray = Array.isArray(employees) ? employees : [];
    return empArray.map((emp) => ({
      id: emp.id,
      label: `${emp.fullName || emp.name || 'Unknown'} · ${emp.positionName || emp.position?.name || emp.chucVu || ''}`,
      fullName: emp.fullName || emp.name || 'Unknown',
      position: emp.positionName || emp.position?.name || emp.chucVu || '',
    }));
  }, [employees]);

  // Lấy danh sách member hiện tại để filter option
  function getAvailableEmployees(excludeIds) {
    return employeeList.filter((e) => !excludeIds.includes(e.id));
  }

  if (!request) return null;

  // priority có thể là HIGH/LOW (từ API) hoặc danger/warning/normal (từ sample data)
  const mucDoKey = request.priority || request.mucDo;
  const mucDo = MUC_DO_MAP[mucDoKey] || MUC_DO_MAP.normal;

  const initialValues = {
    repairRequestId: request.id,
    leaderId: '',
    directSupervisorId: '',
    safetySupervisorId: '',
    startTime: '',
    expectedEndTime: '',
    members: [], // [{ employeeId, roleInTask }]
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" scrollable dialogClassName="pct-modal">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const payload = {
              repairRequestId: values.repairRequestId,
              leaderId: Number(values.leaderId),
              directSupervisorId: values.directSupervisorId ? Number(values.directSupervisorId) : null,
              safetySupervisorId: values.safetySupervisorId ? Number(values.safetySupervisorId) : null,
              startTime: values.startTime || null,
              expectedEndTime: values.expectedEndTime || null,
              members: values.members.map((m) => ({
                employeeId: m.employeeId,
                roleInTask: m.roleInTask || undefined,
              })),
            };

            const res = await workOrderService.create(payload);
            toast.success(`Đã tạo phiếu công tác ${res.data.orderCode}`);
            onCreated?.(request, res.data);
            setSelectedEmployeeId('');
            onClose?.();
          } catch (err) {
            // Xử lý lỗi 409 Conflict - trùng lịch hoặc thành viên
            if (err.response?.status === 409) {
              const errorMsg = err.response?.data?.message || '';
              
              // Kiểm tra loại xung đột
              if (errorMsg.toLowerCase().includes('time') || errorMsg.toLowerCase().includes('thời gian') || errorMsg.toLowerCase().includes('schedule')) {
                toast.error('⚠️ Xung đột thời gian! Một hoặc nhiều nhân viên đã có lịch làm việc trùng với thời gian này. Vui lòng chọn thời gian khác hoặc thay đổi thành viên.');
              } else if (errorMsg.toLowerCase().includes('member') || errorMsg.toLowerCase().includes('employee') || errorMsg.toLowerCase().includes('nhân viên') || errorMsg.toLowerCase().includes('thành viên')) {
                toast.error('⚠️ Xung đột thành viên! Một hoặc nhiều nhân viên đã được phân công vào phiếu công tác khác trong khoảng thời gian này. Vui lòng chọn thành viên khác hoặc thay đổi thời gian.');
              } else {
                // Lỗi conflict khác
                toast.error(`⚠️ Xung đột dữ liệu: ${errorMsg}`);
              }
            } else {
              // Các lỗi khác (400, 500, network, etc.)
              const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
              toast.error(`Không thể tạo PCT: ${msg}`);
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, touched, errors, isSubmitting, setFieldValue }) => {
          const addMember = () => {
            if (!selectedEmployeeId) return;
            const id = Number(selectedEmployeeId);
            if (values.members.some((m) => m.employeeId === id)) {
              toast.info('Nhân viên đã có trong danh sách');
              return;
            }
            const emp = employeeList.find((e) => e.id === id);
            const roleInTask = emp?.position || '';
            setFieldValue('members', [...values.members, { employeeId: id, roleInTask }]);
            setSelectedEmployeeId('');
          };

          const removeMember = (employeeId) => {
            setFieldValue('members', values.members.filter((m) => m.employeeId !== employeeId));
          };

          const excludeIds = values.members.map((m) => m.employeeId);
          const available = getAvailableEmployees(excludeIds);

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
                      Từ yêu cầu <strong>{request.requestCode || request.maRequest}</strong>
                    </span>
                  </div>
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                {/* ===== SECTION: THÔNG TIN THIẾT BỊ (từ Request — chỉ đọc) ===== */}
                <div className="pct-section-title">
                  <BsCpu />
                  Thông tin thiết bị (lấy từ yêu cầu)
                </div>

                <div className="pct-request-card">
                  <div className="pct-info-grid">
                    <InfoItem
                      label="Mã yêu cầu"
                      value={request.requestCode || request.maRequest}
                      mono
                    />
                    <InfoItem
                      label="Thiết bị"
                      value={request.equipmentName || request.thietBi}
                    />
                    <InfoItem
                      label="Mã KKS"
                      value={request.equipmentKksCode || request.maKKS}
                      mono
                    />
                    <InfoItem label="Hệ thống" value={request.heThong || '—'} />
                    <InfoItem
                      label="Người yêu cầu"
                      value={request.requesterName || request.nguoiYeuCau}
                    />
                    <div className="pct-info-item">
                      <span className="pct-info-label">Mức độ</span>
                      <span className="pct-info-value">
                        <StatusBadge status={mucDo.status} label={mucDo.label} pulse={mucDo.pulse} />
                      </span>
                    </div>
                  </div>
                  <div className="pct-info-item pct-info-full">
                    <span className="pct-info-label">Mô tả hư hỏng</span>
                    <span className="pct-info-value">
                      {request.incidentDescription || request.moTa}
                    </span>
                  </div>

                  {/* PCT code is auto-generated — inform the user */}
                  <div className="pct-auto-code-note">
                    Mã PCT sẽ được hệ thống tự sinh sau khi tạo.
                  </div>
                </div>

                {/* ===== SECTION: THỜI GIAN ===== */}
                <div className="pct-section-title mt-4">
                  <BsSave />
                  Thời gian thực hiện
                </div>
                <Row className="mb-3">
                  <Col md={6}>
                    <label htmlFor="pct-startTime" className="form-label">
                      Thời gian bắt đầu <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      id="pct-startTime"
                      name="startTime"
                      type="datetime-local"
                      className={`form-control ${
                        touched.startTime && errors.startTime ? 'is-invalid' : ''
                      }`}
                    />
                    <ErrorMessage name="startTime" component="div" className="invalid-feedback" />
                  </Col>
                  <Col md={6}>
                    <label htmlFor="pct-expectedEndTime" className="form-label">
                      Dự kiến kết thúc
                    </label>
                    <Field
                      id="pct-expectedEndTime"
                      name="expectedEndTime"
                      type="datetime-local"
                      className="form-control"
                    />
                  </Col>
                </Row>

                {/* ===== SECTION: NHÂN SỰ ===== */}
                <div className="pct-section-title mt-4">
                  <BsPeopleFill />
                  Nhân sự thực hiện
                </div>

                <Row className="mb-3">
                  <Col md={4}>
                    <label htmlFor="pct-leaderId" className="form-label">
                      Người lãnh đạo công việc <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      as="select"
                      id="pct-leaderId"
                      name="leaderId"
                      className={`form-select ${
                        touched.leaderId && errors.leaderId ? 'is-invalid' : ''
                      }`}
                    >
                      <option value="">— Chọn —</option>
                      {employeeList.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="leaderId" component="div" className="invalid-feedback" />
                  </Col>
                  <Col md={4}>
                    <label htmlFor="pct-directSupervisorId" className="form-label">
                      Chỉ huy trực tiếp <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      as="select"
                      id="pct-directSupervisorId"
                      name="directSupervisorId"
                      className={`form-select ${
                        touched.directSupervisorId && errors.directSupervisorId ? 'is-invalid' : ''
                      }`}
                    >
                      <option value="">— Chọn —</option>
                      {employeeList.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="directSupervisorId" component="div" className="invalid-feedback" />
                  </Col>
                  <Col md={4}>
                    <label htmlFor="pct-safetySupervisorId" className="form-label">
                      Người giám sát an toàn <span className="required-asterisk">*</span>
                    </label>
                    <Field
                      as="select"
                      id="pct-safetySupervisorId"
                      name="safetySupervisorId"
                      className={`form-select ${
                        touched.safetySupervisorId && errors.safetySupervisorId ? 'is-invalid' : ''
                      }`}
                    >
                      <option value="">— Chọn —</option>
                      {employeeList.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="safetySupervisorId" component="div" className="invalid-feedback" />
                  </Col>
                </Row>

                {/* --- Nhiều thành viên --- */}
                <div className="mb-2">
                  <label className="form-label">
                    Nhiều thành viên
                  </label>
                  <div className="pct-add-nv">
                    <select
                      className="form-select"
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      aria-label="Chọn nhân viên làm việc"
                    >
                      <option value="">— Chọn nhân viên để thêm —</option>
                      {available.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={addMember}
                      disabled={!selectedEmployeeId}
                    >
                      <BsPersonPlus /> Thêm
                    </Button>
                  </div>

                  {values.members.length > 0 && (
                    <div className="pct-nv-list">
                      {values.members.map((m, idx) => {
                        const emp = employeeList.find((e) => e.id === m.employeeId);
                        const name = emp?.fullName || `ID ${m.employeeId}`;
                        const role = m.roleInTask || emp?.position || '';
                        return (
                          <div key={m.employeeId} className="pct-nv-chip">
                            <span className="pct-nv-chip-index">{idx + 1}</span>
                            <span className="pct-nv-chip-info">
                              <strong>{name}</strong>
                              <span>{role}</span>
                            </span>
                            <button
                              type="button"
                              className="pct-nv-chip-remove"
                              onClick={() => removeMember(m.employeeId)}
                              title="Xoá khỏi danh sách"
                            >
                              <BsTrash />
                            </button>
                          </div>
                        );
                      })}
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