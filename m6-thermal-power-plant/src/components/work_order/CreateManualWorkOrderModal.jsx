import { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Row, Col, Table } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  BsPeopleFill, BsPersonPlus, BsTrash,
  BsSave, BsXCircle, BsCpu, BsFileEarmarkPlus, BsSearch,
} from 'react-icons/bs';
import { workOrderService } from '../../services/workOrderService';
import { getAll as getAllEquipment } from '../../services/equipment/equipmentService';
import { employeeService } from '../../services/hr/employeeService';
import LoadingSpinner from '../common/LoadingSpinner';
import './CreateManualWorkOrderModal.css';

/** Mã role (roles.name trong DB) được phép làm Người giám sát an toàn. */
const SAFETY_SUPERVISOR_ROLE = 'SAFETY_SUPERVISOR';

/* ============================================================
   VALIDATION — khớp CreateWorkOrderRequest backend (@NotNull:
   leaderId, directSupervisorId, safetySupervisorId, startTime).
   equipmentIds validate bằng Yup array min 1 (backend trả 400
   nếu rỗng — validate sớm ở client cho UX).
   ============================================================ */
const baseValidationSchema = Yup.object({
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

const validationSchema = baseValidationSchema.shape({
  equipmentIds: Yup.array().min(1, 'Vui lòng chọn ít nhất 1 thiết bị'),
});

const lubricationValidationSchema = baseValidationSchema.shape({
  equipmentLines: Yup.array().min(1, 'Vui lòng chọn ít nhất 1 thiết bị'),
});

/**
 * Lấy nguyên văn message lỗi backend trả về (chuỗi thuần HOẶC {message}) —
 * copy nguyên hàm từ CreateWorkOrderModal.
 */
function extractErrorMessage(err) {
  const data = err.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && data.message) return data.message;
  return err.message || 'Lỗi không xác định';
}

/**
 * CreateManualWorkOrderModal — Tạo phiếu công tác (PCT) THỦ CÔNG nhiều thiết
 * bị, không cần RepairRequest (backend POST /api/v1/work-orders dispatch theo
 * equipmentIds). Nội dung giống modal từ request, thay card thông tin request
 * bằng picker đa chọn thiết bị + ô nhập mô tả công việc.
 *
 * Khi truyền {@code lubricationPlans} (danh sách plan bôi trơn đã chọn từ
 * checklist) → chế độ WO bôi trơn: thiết bị cố định (bảng read-only),
 * payload type=LUBRICATION + equipmentLines.
 *
 * @param {boolean}  props.show
 * @param {Function} props.onClose
 * @param {Function} props.onCreated - (createdWorkOrder) => void, gọi sau khi tạo thành công
 * @param {Array}    [props.lubricationPlans] - plan bôi trơn được chọn (chế độ LUBRICATION)
 */
export default function CreateManualWorkOrderModal({ show, onClose, onCreated, lubricationPlans }) {
  const isLubrication = Array.isArray(lubricationPlans) && lubricationPlans.length > 0;
  const [equipmentList, setEquipmentList] = useState(null); // null = đang tải
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [accountEmployees, setAccountEmployees] = useState(null);
  const [busyIds, setBusyIds] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  useEffect(() => {
    if (!show) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [eqRes, empRes, busyRes] = await Promise.all([
          getAllEquipment({ page: 0, size: 1000 }),
          employeeService.getAllWithAccounts(),
          workOrderService.getBusyEmployees(undefined, ['IN_PROGRESS']),
        ]);
        if (cancelled) return;
        const eqArr = eqRes.data?.content || eqRes.data || [];
        setEquipmentList(Array.isArray(eqArr) ? eqArr : []);
        const empArr = empRes.data?.data || empRes.data || [];
        setAccountEmployees(Array.isArray(empArr) ? empArr : []);
        setBusyIds(Array.isArray(busyRes.data) ? busyRes.data : []);
      } catch (err) {
        if (!cancelled) {
          toast.error(`Không thể tải danh sách thiết bị/nhân viên: ${extractErrorMessage(err)}`);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [show]);

  // Đã có dữ liệu role chưa? (fallback prop không có role → không lọc GSAT được)
  const roleInfoLoaded = accountEmployees !== null;

  // Bộ lọc thiết bị phía client: từ khoá khớp kksCode/name/equipmentType.
  const filteredEquipment = useMemo(() => {
    if (!equipmentList) return [];
    const q = equipmentSearch.trim().toLowerCase();
    return equipmentList.filter((e) => !q
      || (e.kksCode || '').toLowerCase().includes(q)
      || (e.name || '').toLowerCase().includes(q)
      || (e.equipmentType || '').toLowerCase().includes(q));
  }, [equipmentList, equipmentSearch]);

  const employeeList = useMemo(() => {
    const source = accountEmployees ?? [];
    return source
      .filter((emp) => emp.isActive !== false)
      .map((emp) => ({
        id: emp.id,
        label: `${emp.fullName || emp.name || 'Unknown'} · ${emp.positionName || emp.position?.name || ''}`,
        fullName: emp.fullName || emp.name || 'Unknown',
        position: emp.positionName || emp.position?.name || '',
        roles: (emp.roles || []).map((r) => r?.name || r),
      }));
  }, [accountEmployees]);

  const initialValues = {
    equipmentIds: [], // [number]
    equipmentLines: isLubrication
      ? lubricationPlans.map((p) => ({ equipmentId: p.equipment?.id, lubricationPlanId: p.id }))
      : [],
    leaderId: '',
    directSupervisorId: '',
    safetySupervisorId: '',
    startTime: '',
    repairDescription: '',
    members: [], // [{ employeeId, roleInTask }]
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" scrollable dialogClassName="pct-modal">
      <Formik
        initialValues={initialValues}
        validationSchema={isLubrication ? lubricationValidationSchema : validationSchema}
        enableReinitialize
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const common = {
              leaderId: Number(values.leaderId),
              directSupervisorId: values.directSupervisorId ? Number(values.directSupervisorId) : null,
              safetySupervisorId: values.safetySupervisorId ? Number(values.safetySupervisorId) : null,
              startTime: values.startTime || null,
              repairDescription: values.repairDescription || undefined,
              members: values.members.map((m) => ({
                employeeId: m.employeeId,
                roleInTask: m.roleInTask || undefined,
              })),
            };
            const payload = isLubrication
              ? { ...common, type: 'LUBRICATION', equipmentLines: values.equipmentLines }
              : { ...common, equipmentIds: values.equipmentIds };

            const res = await workOrderService.create(payload);
            toast.success(`Đã tạo phiếu công tác ${res.data.orderCode}`);
            onCreated?.(res.data);
            onClose?.();
          } catch (err) {
            const errorMsg = extractErrorMessage(err);
            const status = err.response?.status;

            if (status === 409) {
              // 409 Conflict: thiết bị đang nằm trong PCT sống khác / trùng nhân
              // sự — backend soạn message chính xác (kèm mã PCT) nên hiển thị
              // nguyên văn, không đoán/diễn giải lại.
              toast.error(`⚠️ ${errorMsg}`, { autoClose: 8000 });
            } else {
              // Các lỗi khác (400, 404, 500, network, etc.) — hiển thị nguyên văn.
              toast.error(`Không thể tạo PCT: ${errorMsg}`, { autoClose: 8000 });
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, touched, errors, isSubmitting, setFieldValue }) => {
          const toggleEquipment = (id) => {
            const current = values.equipmentIds;
            setFieldValue('equipmentIds',
              current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
          };

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

          // Quy tắc lọc từng ô (giữ nguyên pattern CreateWorkOrderModal):
          // - LĐ / Chỉ huy trực tiếp ĐƯỢC là CÙNG một người, chỉ không trùng
          //   GSAT/thành viên đã chọn.
          // - GSAT KHÔNG được trùng: loại người đang ở phiếu IN_PROGRESS
          //   (busyIds), người đã chọn ở ô khác/thành viên, và CHỈ hiện người
          //   có role SAFETY_SUPERVISOR (khi đã tải được role).
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
          const available = employeeList.filter((e) => !excludeIds.includes(e.id));

          return (
            <Form noValidate>
              <Modal.Header closeButton>
                <Modal.Title className="pct-modal-title">
                  <span className="pct-modal-title-icon">
                    <BsFileEarmarkPlus />
                  </span>
                  <div>
                    <span className="pct-modal-title-main">
                      {isLubrication ? 'Tạo Phiếu công tác bảo dưỡng dầu mỡ' : 'Tạo Phiếu Công tác thủ công'}
                    </span>
                    <span className="pct-modal-title-sub">
                      {isLubrication ? 'Theo kế hoạch bôi trơn đã chọn từ checklist' : 'Nhiều thiết bị trong phạm vi công tác'}
                    </span>
                  </div>
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                {/* ===== SECTION: CHỌN THIẾT BỊ (đa chọn) ===== */}
                <div className="pct-section-title">
                  <BsCpu />
                  {isLubrication ? 'Thiết bị trong phạm vi công tác' : 'Chọn thiết bị trong phạm vi công tác'}
                </div>

                {isLubrication ? (
                  <div className="pct-equipment-picker">
                    <Table size="sm" bordered className="mb-0">
                      <thead>
                        <tr>
                          <th>Mã KHBD</th>
                          <th>Mã thiết bị</th>
                          <th>Tên thiết bị</th>
                          <th>Hệ thống</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lubricationPlans.map((p) => (
                          <tr key={p.id}>
                            <td>{p.lubricationCode}</td>
                            <td>{p.equipment?.equipmentCode}</td>
                            <td>{p.equipment?.name}</td>
                            <td>{p.equipment?.system?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : equipmentList === null ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <div className="input-group input-group-sm mb-2">
                      <span className="input-group-text"><BsSearch /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm theo mã KKS, tên thiết bị, loại..."
                        value={equipmentSearch}
                        onChange={(e) => setEquipmentSearch(e.target.value)}
                      />
                    </div>

                    <div className="pct-equipment-picker">
                      <Table size="sm" striped hover className="mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Mã KKS</th>
                            <th>Tên thiết bị</th>
                            <th>Loại</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEquipment.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center text-muted py-3">
                                Không tìm thấy thiết bị
                              </td>
                            </tr>
                          ) : filteredEquipment.map((e) => (
                            <tr
                              key={e.id}
                              onClick={() => toggleEquipment(e.id)}
                              className={values.equipmentIds.includes(e.id) ? 'pct-equipment-row-selected' : ''}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  checked={values.equipmentIds.includes(e.id)}
                                  onChange={() => toggleEquipment(e.id)}
                                  onClick={(ev) => ev.stopPropagation()}
                                />
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                                {e.kksCode}
                              </td>
                              <td>{e.name}</td>
                              <td>{e.equipmentType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <div className="form-text">
                      Đã chọn: <strong>{values.equipmentIds.length}</strong> thiết bị
                    </div>
                    <ErrorMessage name="equipmentIds" component="div" className="invalid-feedback d-block" />

                    {/* ===== SECTION: MÔ TẢ ===== */}
                    <div className="pct-section-title mt-4">Mô tả công việc</div>
                    <Field
                      as="textarea"
                      name="repairDescription"
                      rows={3}
                      className={`form-control ${touched.repairDescription && errors.repairDescription ? 'is-invalid' : ''}`}
                      placeholder="Mô tả nội dung công việc (in lên phiếu giấy)"
                    />

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
                          className={`form-control ${touched.startTime && errors.startTime ? 'is-invalid' : ''}`}
                        />
                        <ErrorMessage name="startTime" component="div" className="invalid-feedback" />
                      </Col>
                      <Col md={6}>
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
                      {[
                        { field: 'leaderId', label: 'Người lãnh đạo công việc' },
                        { field: 'directSupervisorId', label: 'Chỉ huy trực tiếp' },
                        { field: 'safetySupervisorId', label: 'Người giám sát an toàn' },
                      ].map(({ field, label }) => (
                        <Col md={4} key={field}>
                          <label htmlFor={`pct-${field}`} className="form-label">
                            {label} <span className="required-asterisk">*</span>
                          </label>
                          <Field
                            as="select"
                            id={`pct-${field}`}
                            name={field}
                            className={`form-select ${touched[field] && errors[field] ? 'is-invalid' : ''}`}
                          >
                            <option value="">— Chọn —</option>
                            {optionsFor(field).map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.label}
                              </option>
                            ))}
                          </Field>
                          <ErrorMessage name={field} component="div" className="invalid-feedback" />
                        </Col>
                      ))}
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
                  </>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button variant="outline-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
                  <BsXCircle /> Huỷ bỏ
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting || equipmentList === null}>
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
