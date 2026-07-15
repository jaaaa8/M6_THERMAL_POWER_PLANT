import { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  BsPeopleFill, BsPersonPlus, BsTrash,
  BsSave, BsXCircle, BsCpu, BsFileEarmarkPlus,
} from 'react-icons/bs';
import { workOrderService } from '../../services/workOrderService';
import { employeeService } from '../../services/hr/employeeService';
import StatusBadge from '../common/StatusBadge';
import './CreateWorkOrderModal.css';

/** Mã role (roles.name trong DB) được phép làm Người giám sát an toàn. */
const SAFETY_SUPERVISOR_ROLE = 'SAFETY_SUPERVISOR';

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
 * Lấy nguyên văn message lỗi backend trả về.
 *
 * GlobalExceptionHandler trả về 2 dạng response khác nhau tuỳ exception:
 *  - ApiResponse<Object> (JSON, có field `message`) — VD lỗi validation.
 *  - ResponseEntity<String> (body là CHUỖI THUẦN) — VD ObjectNotFoundException,
 *    IllegalStateException, DuplicateHumanResourceException, TimeOverlapException.
 * Nếu chỉ đọc `err.response.data.message` thì ở dạng thứ 2 sẽ luôn ra `undefined`
 * (chuỗi thuần không có field `.message`) — nên phải kiểm tra cả hai dạng.
 */
function extractErrorMessage(err) {
  const data = err.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && data.message) return data.message;
  return err.message || 'Lỗi không xác định';
}

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

  // Danh sách nhân viên KÈM ROLE tài khoản (để lọc Người giám sát an toàn) +
  // danh sách id đang ở phiếu IN_PROGRESS (chỉ dùng để loại khỏi ô GSAT —
  // GSAT không được trùng người đang giám sát phiếu đang thực hiện).
  // Prop `employees` (không có role) chỉ là fallback trong lúc chờ tải.
  const [accountEmployees, setAccountEmployees] = useState(null); // null = chưa tải
  const [busyIds, setBusyIds] = useState([]);

  useEffect(() => {
    if (!show) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [empRes, busyRes] = await Promise.all([
          employeeService.getAllWithAccounts(),
          workOrderService.getBusyEmployees(undefined, ['IN_PROGRESS']),
        ]);
        if (cancelled) return;
        const empArr = empRes.data?.data || empRes.data || [];
        setAccountEmployees(Array.isArray(empArr) ? empArr : []);
        setBusyIds(Array.isArray(busyRes.data) ? busyRes.data : []);
      } catch (err) {
        if (!cancelled) {
          toast.error(`Không thể tải danh sách nhân viên khả dụng: ${extractErrorMessage(err)}`);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [show]);

  // Đã có dữ liệu role chưa? (fallback prop không có role → không lọc GSAT được)
  const roleInfoLoaded = accountEmployees !== null;

  // Chuẩn bị danh sách employee để hiển thị trong select — chỉ LOẠI người đã
  // nghỉ (isActive = false). Người đang bận ở phiếu khác VẪN hiện (permissive);
  // riêng ô Người giám sát an toàn loại busyIds trong optionsFor.
  const employeeList = useMemo(() => {
    const source = accountEmployees ?? (Array.isArray(employees) ? employees : []);
    return source
      .filter((emp) => emp.isActive !== false)
      .map((emp) => ({
        id: emp.id,
        label: `${emp.fullName || emp.name || 'Unknown'} · ${emp.positionName || emp.position?.name || emp.chucVu || ''}`,
        fullName: emp.fullName || emp.name || 'Unknown',
        position: emp.positionName || emp.position?.name || emp.chucVu || '',
        roles: (emp.roles || []).map((r) => r?.name || r),
      }));
  }, [accountEmployees, employees]);

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
            const errorMsg = extractErrorMessage(err);
            const status = err.response?.status;

            if (status === 409) {
              // 409 Conflict: TimeOverlapException / DuplicateHumanResourceException /
              // IllegalStateException — backend đã soạn sẵn message mô tả CHÍNH XÁC
              // xung đột nào (kèm mã PCT liên quan) nên hiển thị nguyên văn, không
              // đoán/diễn giải lại. Chỉ chọn icon theo loại để dễ nhận biết.
              let icon = '⚠️';
              if (errorMsg.includes('chong lan')) {
                icon = '⏰'; // TimeOverlapException
              } else if (errorMsg.includes('da duoc phan cong')) {
                icon = '👥'; // DuplicateHumanResourceException
              }
              toast.error(`${icon} ${errorMsg}`, { autoClose: 8000 });
            } else {
              // Các lỗi khác (400, 404, 500, network, etc.) — vẫn hiển thị nguyên văn.
              toast.error(`Không thể tạo PCT: ${errorMsg}`, { autoClose: 8000 });
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

          const roleFieldIds = {
            leaderId: values.leaderId ? Number(values.leaderId) : null,
            directSupervisorId: values.directSupervisorId ? Number(values.directSupervisorId) : null,
            safetySupervisorId: values.safetySupervisorId ? Number(values.safetySupervisorId) : null,
          };
          const memberIds = values.members.map((m) => m.employeeId);
          const busy = new Set(busyIds);

          // Quy tắc lọc từng ô (user-specified):
          // - Người LĐ / Chỉ huy trực tiếp ĐƯỢC là CÙNG một người trong 1 phiếu
          //   (không loại chéo lẫn nhau), chỉ không trùng GSAT/thành viên đã chọn.
          // - GSAT KHÔNG được trùng: loại người đang ở phiếu IN_PROGRESS (busyIds),
          //   người đã chọn ở ô khác/thành viên, và CHỈ hiện người có role
          //   SAFETY_SUPERVISOR (khi đã tải được role — fallback prop thì bỏ lọc).
          const optionsFor = (field) => employeeList.filter((e) => {
            if (memberIds.includes(e.id)) return false;
            if (field === 'safetySupervisorId') {
              if (busy.has(e.id)) return false;
              if (roleFieldIds.leaderId === e.id || roleFieldIds.directSupervisorId === e.id) return false;
              if (roleInfoLoaded && !e.roles.includes(SAFETY_SUPERVISOR_ROLE)) return false;
            } else if (roleFieldIds.safetySupervisorId === e.id) {
              return false;
            }
            return true;
          });

          const excludeIds = [...memberIds, ...Object.values(roleFieldIds).filter(Boolean)];
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
                      {optionsFor('leaderId').map((e) => (
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
                      {optionsFor('directSupervisorId').map((e) => (
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
                      {optionsFor('safetySupervisorId').map((e) => (
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