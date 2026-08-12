import { useEffect, useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  BsPeopleFill, BsTrash,
  BsSave, BsXCircle, BsCpu, BsFileEarmarkPlus,
} from 'react-icons/bs';
import { workOrderService } from '../../services/workOrderService';
import { employeeService } from '../../services/hr/employeeService';
import StatusBadge from '../common/StatusBadge';
import SearchSelectField from '../common/SearchSelectField';
import { searchWorkOrderRoles } from '../common/workOrderRoleSearch';
import './CreateWorkOrderModal.css';

/** Mã role (roles.name trong DB) được phép làm Người giám sát an toàn. */
const SAFETY_SUPERVISOR_ROLE = 'SAFETY_SUPERVISOR';

const EMP_KEY = (e) => e.id;
const EMP_LABEL = (e) => `${e.fullName || e.name || 'Unknown'}${e.employeeCode ? ` (${e.employeeCode})` : ''}`;
const EMP_RENDER = (e) => (
  <div>
    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
      {e.fullName || e.name || 'Unknown'}
      <span className="font-mono text-muted ms-2 small">{e.employeeCode}</span>
    </div>
    <div className="text-muted small">
      {[e.position?.name, e.department?.name].filter(Boolean).join(' · ') || '—'}
    </div>
  </div>
);
const searchEmployees = (p) => employeeService.search({
  keyword: p.query || undefined,
  page: p.page,
  size: p.size,
});

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
 * @param {Function} props.onCreated - (request, createdWorkOrder) => void
 */
export default function ModalCreateWorkOrder({
  show,
  onClose,
  request,
  onCreated,
}) {
  // Ba vai trò PCT tìm local trên snapshot đầy đủ; chỉ tải lại khi mở modal.
  const [roleEmployees, setRoleEmployees] = useState([]);
  const [busyIds, setBusyIds] = useState([]);

  useEffect(() => {
    if (!show) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [employeeRes, busyRes] = await Promise.all([
          employeeService.getAllWithAccounts(),
          workOrderService.getBusyEmployees(undefined),
        ]);
        if (cancelled) return;
        const employees = employeeRes.data?.data || employeeRes.data || [];
        setRoleEmployees(Array.isArray(employees) ? employees : []);
        setBusyIds(Array.isArray(busyRes.data) ? busyRes.data : []);
      } catch (err) {
        if (!cancelled) {
          setRoleEmployees([]);
          setBusyIds([]);
          toast.error(`Không thể tải danh sách nhân viên khả dụng: ${extractErrorMessage(err)}`);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [show]);

  if (!request) return null;

  // priority có thể là HIGH/LOW (từ API) hoặc danger/warning/normal (từ sample data)
  const mucDoKey = request.priority || request.mucDo;
  const mucDo = MUC_DO_MAP[mucDoKey] || MUC_DO_MAP.normal;

  const initialValues = {
    repairRequestId: request.id,
    leaderId: '',
    directSupervisorId: '',
    safetySupervisorId: '',
    leaderLabel: '',
    directSupervisorLabel: '',
    safetySupervisorLabel: '',
    startTime: '',
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
              members: values.members.map((m) => ({
                employeeId: m.employeeId,
                roleInTask: m.roleInTask || undefined,
              })),
            };

            const res = await workOrderService.create(payload);
            toast.success(`Đã tạo phiếu công tác ${res.data.orderCode}`);
            onCreated?.(request, res.data);
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
          // - CẢ 3 vai trò phụ trách chỉ hiện nhân viên RẢNH (không ở phiếu
          //   STOPPED/IN_PROGRESS nào — busyIds).
          // - Người LĐ / Chỉ huy trực tiếp ĐƯỢC là CÙNG một người trong 1 phiếu
          //   (không loại chéo lẫn nhau), chỉ không trùng GSAT.
          // - GSAT thêm điều kiện: khác LĐ/chỉ huy + CHỈ hiện người có role
          //   SAFETY_SUPERVISOR (roles lấy từ kết quả search — account.roles).
          const roleFilter = (field) => (list) => list.filter((e) => {
            if (busy.has(e.id)) return false;
            if (field === 'safetySupervisorId') {
              if (roleFieldIds.leaderId === e.id || roleFieldIds.directSupervisorId === e.id) return false;
              const roles = (e.roles || []).map((r) => r?.name || r);
              if (!roles.includes(SAFETY_SUPERVISOR_ROLE)) return false;
            } else if (roleFieldIds.safetySupervisorId === e.id) {
              return false;
            }
            return true;
          });
          const roleSearch = (field) => (params) =>
            searchWorkOrderRoles(roleEmployees, params, roleFilter(field));

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
                    {/* Không nhập mốc kết thúc: giờ kết thúc là mốc THỰC TẾ, hệ
                        thống tự ghi khi phiếu chuyển Hoàn thành. */}
                    <div className="form-text mt-4">
                      Giờ kết thúc được hệ thống ghi nhận khi phiếu hoàn thành.
                    </div>
                  </Col>
                </Row>

                {/* ===== SECTION: NHÂN SỰ ===== */}
                <div className="pct-section-title mt-4">
                  <BsPeopleFill />
                  Nhân sự thực hiện
                </div>

                <Row className="mb-3">
                  <Col md={4}>
                    <SearchSelectField
                      label="Người lãnh đạo công việc"
                      required
                      mode="single"
                      searchFn={roleSearch('leaderId')}
                      getKey={EMP_KEY}
                      renderItem={EMP_RENDER}
                      placeholder="Tìm theo tên, mã NV, phòng ban..."
                      value={values.leaderId || null}
                      onChange={(item) => {
                        setFieldValue('leaderId', item ? item.id : '');
                        setFieldValue('leaderLabel', item ? EMP_LABEL(item) : '');
                      }}
                      selectedLabel={values.leaderLabel}
                      excludedIds={memberIds.concat(values.safetySupervisorId ? [Number(values.safetySupervisorId)] : [])}
                      filterClient={roleFilter('leaderId')}
                      error={touched.leaderId && errors.leaderId}
                    />
                  </Col>
                  <Col md={4}>
                    <SearchSelectField
                      label="Chỉ huy trực tiếp"
                      required
                      mode="single"
                      searchFn={roleSearch('directSupervisorId')}
                      getKey={EMP_KEY}
                      renderItem={EMP_RENDER}
                      placeholder="Tìm theo tên, mã NV, phòng ban..."
                      value={values.directSupervisorId || null}
                      onChange={(item) => {
                        setFieldValue('directSupervisorId', item ? item.id : '');
                        setFieldValue('directSupervisorLabel', item ? EMP_LABEL(item) : '');
                      }}
                      selectedLabel={values.directSupervisorLabel}
                      excludedIds={memberIds.concat(values.safetySupervisorId ? [Number(values.safetySupervisorId)] : [])}
                      filterClient={roleFilter('directSupervisorId')}
                      error={touched.directSupervisorId && errors.directSupervisorId}
                    />
                  </Col>
                  <Col md={4}>
                    <SearchSelectField
                      label="Người giám sát an toàn"
                      required
                      mode="single"
                      searchFn={roleSearch('safetySupervisorId')}
                      getKey={EMP_KEY}
                      renderItem={EMP_RENDER}
                      placeholder="Tìm theo tên, mã NV, phòng ban..."
                      value={values.safetySupervisorId || null}
                      onChange={(item) => {
                        setFieldValue('safetySupervisorId', item ? item.id : '');
                        setFieldValue('safetySupervisorLabel', item ? EMP_LABEL(item) : '');
                      }}
                      selectedLabel={values.safetySupervisorLabel}
                      excludedIds={memberIds.concat([values.leaderId, values.directSupervisorId].map(Number).filter(Boolean))}
                      filterClient={roleFilter('safetySupervisorId')}
                      error={touched.safetySupervisorId && errors.safetySupervisorId}
                    />
                  </Col>
                </Row>

                {/* --- Nhiều thành viên --- */}
                <div className="mb-2">
                  <SearchSelectField
                    label="Nhiều thành viên"
                    mode="add"
                    searchFn={searchEmployees}
                    getKey={EMP_KEY}
                    renderItem={EMP_RENDER}
                    placeholder="Tìm nhân viên để thêm..."
                    onAdd={(item) => {
                      const id = Number(item.id);
                      if (values.members.some((m) => m.employeeId === id)) {
                        toast.info('Nhân viên đã có trong danh sách');
                        return;
                      }
                      setFieldValue('members', [
                        ...values.members,
                        { employeeId: id, roleInTask: item.position?.name || '', _label: EMP_LABEL(item) },
                      ]);
                    }}
                    excludedIds={memberIds.concat(Object.values(roleFieldIds).filter(Boolean))}
                  />

                  {values.members.length > 0 && (
                    <div className="pct-nv-list">
                      {values.members.map((m, idx) => {
                        const name = m._label || `ID ${m.employeeId}`;
                        const role = m.roleInTask || '';
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
