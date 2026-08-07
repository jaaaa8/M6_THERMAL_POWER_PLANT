import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Tabs, Tab } from 'react-bootstrap';
import {
  BsXCircle, BsCpu, BsPeopleFill, BsClockHistory,
  BsBoxArrowInRight, BsBoxArrowLeft, BsPersonBadge,
  BsCircleFill, BsPersonPlus, BsSearch,
  BsCalendarWeek, BsPrinter,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmModal from '../common/ConfirmModal';
import { workOrderService } from '../../services/workOrderService';
import { employeeService } from '../../services/hr/employeeService';
import { authService } from '../../services/authService';
import { isTerminalStatus, openPdfBlob, blobErrorMessage } from './pdfUtils';
import './WorkOrderDetailModal.css';

const STATUS_MAP = {
  STOPPED: { label: 'Tạm dừng', status: 'inactive' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
};

/**
 * Gating theo vai trò (chỉ ở UI — backend chặn riêng ở từng endpoint):
 * - MANAGE_MEMBER_ROLES: Quản đốc SC / Tổ trưởng thao tác thành viên (thêm/rời).
 * Mọi bước chuyển trạng thái (mở / khoá phiếu ngày, khoá hoàn thành, huỷ) và
 * chỉnh sửa thông tin nằm ở DANH SÁCH PCT (WorkOrderStatusModal /
 * WorkOrderEditModal).
 */
const MANAGE_MEMBER_ROLES = ['MAINTENANCE_FOREMAN', 'TEAM_LEADER', 'ADMIN'];

const EQUIPMENT_STATUS_ROLES = ['MAINTENANCE_FOREMAN', 'TEAM_LEADER', 'ADMIN'];

const EQUIPMENT_STATUS_MAP = {
  IN_PROGRESS: { status: 'warning', label: 'Đang thực hiện' },
  COMPLETED: { status: 'normal', label: 'Đã xong' },
  CANCELED: { status: 'inactive', label: 'Đã huỷ' },
};

/**
 * Lấy nguyên văn message lỗi backend trả về (GlobalExceptionHandler trả về
 * cả dạng JSON có `message` lẫn dạng CHUỖI THUẦN tuỳ exception).
 */
function extractErrorMessage(err) {
  const data = err.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && data.message) return data.message;
  return err.message || 'Lỗi không xác định';
}

/**
 * WorkOrderDetailModal — Modal hiển thị chi tiết phiếu công tác bao gồm:
 * - Thông tin chung (mã PCT, thiết bị, leader, supervisors)
 * - Danh sách thành viên hiện tại (online - leftAt = null)
 * - Danh sách thành viên đã rời (offline - leftAt != null)
 * - Lịch sử timeline (JOINED/LEFT events)
 *
 * @param {boolean} props.show - Hiển thị modal
 * @param {Function} props.onClose - Callback khi đóng modal
 * @param {number} props.workOrderId - ID phiếu công tác
 * @param {Function} [props.onChanged] - Gọi sau khi đổi trạng thái một THIẾT BỊ
 *        để danh sách phía sau refetch. Các bước chuyển trạng thái của PHIẾU nằm
 *        ở WorkOrderStatusModal, không phải ở đây.
 */
export default function WorkOrderDetailModal({ show, onClose, workOrderId, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [printing, setPrinting] = useState(false);
  // Khoá nút trong lúc đổi trạng thái thiết bị (PCT thủ công).
  const [actionLoading, setActionLoading] = useState(false);

  // Quản lý thành viên (rời / thêm mới)
  const [memberTab, setMemberTab] = useState('members');
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [employees, setEmployees] = useState(null); // null = chưa tải
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [addingEmployeeId, setAddingEmployeeId] = useState(null);
  // Id nhân viên đang bận ở phiếu công tác sống KHÁC (vai trò phụ trách hoặc
  // thành viên chưa rời) — ẩn khỏi gợi ý thêm. null = chưa tải.
  const [busyIds, setBusyIds] = useState(null);
  // Giờ VÀO nhập tay khi thêm thành viên (mặc định = hiện tại, sửa được).
  const [joinTime, setJoinTime] = useState(() => toLocalInput(new Date().toISOString()));
  // Giờ RỜI nhập tay khi xác nhận thành viên rời (mặc định = hiện tại).
  const [leaveTime, setLeaveTime] = useState('');

  /**
   * Tải chi tiết PCT. silent = true → không bật spinner toàn thân modal
   * (dùng khi refresh sau một hành động thêm/rời thành viên).
   */
  const loadDetail = useCallback(async (silent = false) => {
    if (!workOrderId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await workOrderService.getById(workOrderId);
      // API returns { workOrder: {...}, memberHistory: [...], extensions: [...] }
      const data = res.data;
      // Flatten the structure for easier access
      const flattenedDetail = {
        ...data.workOrder,
        memberHistory: data.memberHistory || [],
        extensions: data.extensions || [],
        // Add computed fields
        currentMembers: data.workOrder?.members || [],
      };
      setDetail(flattenedDetail);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tải chi tiết';
      setError(msg);
      toast.error(`Lỗi: ${msg}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    if (!show || !workOrderId) return;
    setMemberTab('members');
    setEmpSearch('');
    setJoinTime(toLocalInput(new Date().toISOString()));
    setBusyIds(null); // tải lại mỗi lần mở — trạng thái bận đổi liên tục
    loadDetail();
  }, [show, workOrderId, loadDetail]);

  // Tải danh sách nhân viên khi mở tab "Thêm thành viên" lần đầu
  // (backend không có endpoint search — tải hết rồi lọc phía client).
  useEffect(() => {
    if (!show || memberTab !== 'add' || employees !== null || employeesLoading) return;
    (async () => {
      setEmployeesLoading(true);
      try {
        const res = await employeeService.getAll();
        const arr = res.data?.data || res.data || [];
        setEmployees(Array.isArray(arr) ? arr : []);
      } catch (err) {
        toast.error(`Không thể tải danh sách nhân viên: ${extractErrorMessage(err)}`);
        setEmployees([]);
      } finally {
        setEmployeesLoading(false);
      }
    })();
  }, [show, memberTab, employees, employeesLoading]);

  // Tải danh sách nhân viên ĐANG BẬN ở phiếu sống KHÁC khi mở tab thêm (mỗi
  // lần mở modal tải lại — busyIds reset về null lúc mở). Lỗi thì coi như
  // không ai bận (bộ lọc gợi ý thôi, backend không chặn).
  useEffect(() => {
    if (!show || memberTab !== 'add' || busyIds !== null || !workOrderId) return;
    (async () => {
      try {
        const res = await workOrderService.getBusyEmployees(workOrderId);
        setBusyIds(Array.isArray(res.data) ? res.data : []);
      } catch {
        setBusyIds([]);
      }
    })();
  }, [show, memberTab, busyIds, workOrderId]);

  // Nhân viên hiển thị trong tab thêm: loại người ĐANG trong khu vực làm việc
  // (người đã rời vẫn hiện — backend cho phép vào lại), 3 vai trò phụ trách của
  // CHÍNH phiếu này và người ĐANG BẬN ở phiếu công tác sống khác.
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    const activeIds = new Set(
      (detail?.currentMembers || []).filter((m) => !m.leftAt).map((m) => m.employeeId)
    );
    const roleIds = new Set(
      [detail?.leaderId, detail?.directSupervisorId, detail?.safetySupervisorId].filter(Boolean)
    );
    const busy = new Set(busyIds || []);
    const q = empSearch.trim().toLowerCase();
    return employees
      .filter((e) => e.isActive !== false && !activeIds.has(e.id) && !roleIds.has(e.id) && !busy.has(e.id))
      .filter((e) => {
        if (!q) return true;
        return (
          (e.fullName || '').toLowerCase().includes(q) ||
          (e.employeeCode || '').toLowerCase().includes(q) ||
          (e.department?.name || '').toLowerCase().includes(q) ||
          (e.position?.name || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 30);
  }, [employees, detail, empSearch, busyIds]);

  const confirmLeave = async () => {
    if (!leaveTarget) return;
    setLeaveLoading(true);
    try {
      const leftAt = leaveTime ? `${leaveTime}:00` : undefined;
      await workOrderService.leaveMember(workOrderId, leaveTarget.id, leftAt);
      toast.success(`Đã ghi nhận ${leaveTarget.fullName} rời khu vực làm việc`);
      setLeaveTarget(null);
      await loadDetail(true);
    } catch (err) {
      toast.error(`Không thể ghi nhận rời: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleAddMember = async (emp) => {
    setAddingEmployeeId(emp.id);
    try {
      const joinedAt = joinTime ? `${joinTime}:00` : undefined;
      await workOrderService.addMember(workOrderId, emp.id, joinedAt);
      toast.success(`Đã thêm ${emp.fullName} vào phiếu công tác`);
      await loadDetail(true);
    } catch (err) {
      toast.error(`Không thể thêm thành viên: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setAddingEmployeeId(null);
    }
  };

  /**
   * In PCT: phiếu đã kết thúc → mở thẳng bản lưu đóng băng trên Cloudinary;
   * phiếu còn sống → backend render snapshot mới (kèm mọi thay đổi thành viên,
   * gia hạn) — dùng bản in này đưa Trưởng ca ký duyệt gia hạn.
   */
  const handlePrintWorkOrder = async () => {
    if (isTerminalStatus(detail?.status) && detail?.pdfPath) {
      window.open(detail.pdfPath, '_blank');
      return;
    }
    setPrinting(true);
    try {
      const res = await workOrderService.exportPdf(workOrderId);
      openPdfBlob(res.data);
    } catch (err) {
      toast.error(`Không thể in phiếu công tác: ${await blobErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setPrinting(false);
    }
  };

  /**
   * Đánh dấu một thiết bị của PCT thủ công đã xong / mở lại. Chỉ PCT thủ công có
   * danh sách thiết bị riêng; PCT sinh từ yêu cầu sửa chữa chỉ có một thiết bị
   * nên không dùng tới (xem điều kiện detail.repairRequestId == null ở JSX).
   */
  const handleUpdateEquipmentStatus = async (equipmentId, status) => {
    setActionLoading(true);
    try {
      await workOrderService.updateEquipmentStatus(workOrderId, equipmentId, status);
      toast.success(status === 'COMPLETED' ? 'Đã đánh dấu thiết bị hoàn thành' : 'Đã mở lại thiết bị');
      await loadDetail(true);
      onChanged?.();
    } catch (err) {
      toast.error(`Không thể cập nhật trạng thái thiết bị: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setActionLoading(false);
    }
  };

  if (!show) return null;

  // Cho thao tác thành viên / chỉnh sửa với MỌI phiếu còn sống — chỉ phiếu đã
  // kết thúc (COMPLETED/CANCELLED, chứng từ đã chốt) mới khoá.
  const canManage = detail ? !['COMPLETED', 'CANCELLED'].includes(detail.status) : false;

  // Gating theo vai trò của tài khoản đang đăng nhập (chỉ ở UI).
  const userRoles = authService.getCurrentUser()?.roles || [];
  const canManageMembers = userRoles.some((r) => MANAGE_MEMBER_ROLES.includes(r));
  const canUpdateEquipmentStatus = userRoles.some((r) => EQUIPMENT_STATUS_ROLES.includes(r));

  const statusInfo = detail?.status ? STATUS_MAP[detail.status] || { label: detail.status, status: 'info' } : null;

  // Workers only (not including leaders/supervisors)
  const workers = detail?.currentMembers || [];
  
  // Sort workers: online first, then offline
  const sortedWorkers = [...workers].sort((a, b) => {
    if (!a.leftAt && b.leftAt) return -1;
    if (a.leftAt && !b.leftAt) return 1;
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  // Timeline events from memberHistory (sorted by eventTime)
  const timeline = detail?.memberHistory || [];
  
  // Check if leaders/supervisors are in the members list (to determine online status)
  const leaderMember = workers.find(m => m.employeeId === detail?.leaderId);
  const supervisorMember = workers.find(m => m.employeeId === detail?.directSupervisorId);
  const safetyMember = workers.find(m => m.employeeId === detail?.safetySupervisorId);

  return (
    <>
    <Modal show={show} onHide={onClose} centered size="xl" scrollable dialogClassName="wo-detail-modal">
      <Modal.Header closeButton>
        <Modal.Title className="wo-detail-modal-title">
          <BsCpu className="me-2" style={{ color: 'var(--color-primary)' }} />
          <div>
            <span className="wo-detail-modal-title-main">
              Phiếu Công tác {detail?.orderCode}
            </span>
            {statusInfo && (
              <StatusBadge
                status={statusInfo.status}
                label={statusInfo.label}
                pulse={detail.status === 'IN_PROGRESS'}
              />
            )}
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : !detail ? (
          <div className="text-muted text-center py-4">Không có dữ liệu</div>
        ) : (
          <>
            {/* ===== TWO COLUMN LAYOUT ===== */}
            <div className="wo-detail-columns">
              {/* LEFT COLUMN */}
              <div className="wo-detail-column-left">
                {/* ===== SECTION: THÔNG TIN THIẾT BỊ ===== */}
                <div className="wo-detail-section">
                  <div className="wo-detail-section-title">
                    <BsCpu />
                    Thông tin thiết bị
                  </div>
                  {detail.equipments?.length ? (
                    <div className="wo-detail-info-grid">
                      <div className="wo-detail-equipments-list">
                        {detail.equipments.map((e) => (
                          <div key={e.id} className="wo-detail-equipment-item">
                            <div style={{ fontWeight: 'var(--font-semibold)' }}>{e.name}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                              {e.kksCode}
                              {e.systemName ? ` · ${e.systemName}` : ''}
                            </div>
                            <div className="wo-detail-equipment-status">
                              <StatusBadge
                                status={EQUIPMENT_STATUS_MAP[e.status]?.status || 'inactive'}
                                label={EQUIPMENT_STATUS_MAP[e.status]?.label || e.status}
                              />
                              {canUpdateEquipmentStatus && canManage && detail.repairRequestId == null && (
                                <button
                                  type="button"
                                  className={`btn btn-sm ${e.status === 'IN_PROGRESS' ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                                  disabled={actionLoading}
                                  onClick={() => handleUpdateEquipmentStatus(
                                    e.id,
                                    e.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS',
                                  )}
                                >
                                  {e.status === 'IN_PROGRESS' ? 'Hoàn thành' : 'Mở lại'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <InfoItem label="Mô tả" value={detail.repairDescription} />
                    </div>
                  ) : (
                    <div className="wo-detail-info-grid">
                      <InfoItem label="Mã KKS" value={detail.equipmentKksCode} mono />
                      <InfoItem label="Tên thiết bị" value={detail.equipmentName} />
                      <InfoItem label="Mã yêu cầu" value={detail.requestCode} mono />
                      <InfoItem label="Mô tả" value={detail.repairDescription} />
                    </div>
                  )}
                </div>

                {/* ===== SECTION: NHÂN SỰ QUẢN LÝ ===== */}
                <div className="wo-detail-section">
                  <div className="wo-detail-section-title">
                    <BsPersonBadge />
                    Nhân sự phụ trách
                  </div>
                  <div className="wo-detail-info-grid">
                    {/* Nhãn theo ĐÚNG mẫu PCT (phieu_cong_tac.md 1.1/1.2 + mục 3),
                        khớp form tạo phiếu và bản in PDF. */}
                    <InfoItemWithStatus
                      label="Người lãnh đạo công việc"
                      value={detail.leaderName}
                      isOnline={!leaderMember?.leftAt}
                    />
                    <InfoItemWithStatus
                      label="Người chỉ huy trực tiếp"
                      value={detail.directSupervisorName}
                      isOnline={!supervisorMember?.leftAt}
                    />
                    <InfoItemWithStatus
                      label="Người giám sát an toàn"
                      value={detail.safetySupervisorName}
                      isOnline={!safetyMember?.leftAt}
                    />
                  </div>
                </div>

                {/* ===== SECTION: THỜI GIAN ===== */}
                <div className="wo-detail-section">
                  <div className="wo-detail-section-title">
                    <BsClockHistory />
                    Thời gian
                  </div>
                  <div className="wo-detail-info-grid">
                    <InfoItem label="Ngày bắt đầu" value={formatDateTime(detail.startTime)} />
                    <InfoItem label="Ngày kết thúc" value={formatDateTime(detail.endTime)} />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="wo-detail-column-right">
                {/* ===== SECTION: NHÂN VIÊN (WORKERS ONLY) ===== */}
                <div className="wo-detail-section">
                  <div className="wo-detail-section-title">
                    <BsPeopleFill />
                    Thành viên tham gia ({sortedWorkers.length})
                  </div>
                  <Tabs activeKey={memberTab} onSelect={(k) => setMemberTab(k)} className="mb-2">
                    <Tab eventKey="members" title="Thành viên">
                      {sortedWorkers.length === 0 ? (
                        <div className="text-muted text-center py-3">Không có nhân viên nào</div>
                      ) : (
                        <div className="wo-detail-member-list-compact">
                          {sortedWorkers.map((m) => (
                            <MemberCardCompact
                              key={m.id}
                              member={m}
                              isOnline={!m.leftAt}
                              onLeave={canManage && canManageMembers && !m.leftAt
                                ? () => {
                                    setLeaveTime(toLocalInput(new Date().toISOString()));
                                    setLeaveTarget(m);
                                  }
                                : undefined}
                            />
                          ))}
                        </div>
                      )}
                    </Tab>
                    {canManage && canManageMembers && (
                      <Tab
                        eventKey="add"
                        title={<span><BsPersonPlus className="me-1" />Thêm thành viên</span>}
                      >
                        <div className="input-group input-group-sm mb-2">
                          <span className="input-group-text"><BsClockHistory /></span>
                          <input
                            type="datetime-local"
                            className="form-control"
                            aria-label="Giờ vào khu vực làm việc"
                            value={joinTime}
                            onChange={(e) => setJoinTime(e.target.value)}
                          />
                        </div>
                        <div className="form-text mb-2" style={{ fontSize: 'var(--text-xs)' }}>
                          Giờ vào nhập tay (mặc định = hiện tại) — không lấy realtime.
                        </div>
                        <div className="input-group input-group-sm mb-2">
                          <span className="input-group-text"><BsSearch /></span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Tìm theo tên, mã NV, phòng ban, chức vụ..."
                            value={empSearch}
                            onChange={(e) => setEmpSearch(e.target.value)}
                          />
                        </div>
                        {employeesLoading || employees === null ? (
                          <LoadingSpinner />
                        ) : filteredEmployees.length === 0 ? (
                          <div className="text-muted text-center py-3">
                            Không tìm thấy nhân viên phù hợp
                          </div>
                        ) : (
                          <div className="list-group" style={{ maxHeight: 320, overflowY: 'auto' }}>
                            {filteredEmployees.map((e) => (
                              <div
                                key={e.id}
                                className="list-group-item d-flex justify-content-between align-items-center py-2"
                              >
                                <div>
                                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
                                    {e.fullName}
                                    <span className="font-mono text-muted ms-2 small">{e.employeeCode}</span>
                                  </div>
                                  <div className="text-muted small">
                                    {[e.position?.name, e.department?.name].filter(Boolean).join(' · ') || '—'}
                                  </div>
                                </div>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  disabled={addingEmployeeId === e.id}
                                  onClick={() => handleAddMember(e)}
                                >
                                  <BsPersonPlus className="me-1" />
                                  {addingEmployeeId === e.id ? 'Đang thêm...' : 'Thêm'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </Tab>
                    )}
                  </Tabs>
                </div>
              </div>
            </div>

            {/* ===== SECTION: NHẬT KÝ CÔNG TÁC HÀNG NGÀY ===== */}
            {(detail.extensions || []).length > 0 && (
              <div className="wo-detail-section">
                <div className="wo-detail-section-title">
                  <BsCalendarWeek />
                  Nhật ký công tác hàng ngày ({detail.extensions.length})
                </div>
                <div className="text-muted mb-2" style={{ fontSize: 'var(--text-xs)' }}>
                  Mỗi dòng là một ngày công tác, ghi từ lúc Trưởng ca mở phiếu ngày
                  đến lúc khoá. Bảng này được in vào bản giấy PCT.
                </div>
                <table className="table table-sm table-bordered mb-0" style={{ fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th style={{ width: 130 }}>Ngày công tác</th>
                      <th style={{ width: 160 }}>Giờ mở</th>
                      <th style={{ width: 160 }}>Giờ khoá</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.extensions.map((day, idx) => (
                      <tr key={day.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td>{formatDate(day.allowedDate)}</td>
                        <td>{formatDateTime(day.requestedAt)}</td>
                        <td>
                          {day.closedAt
                            ? formatDateTime(day.closedAt)
                            : <span className="text-muted fst-italic">Đang làm việc...</span>}
                        </td>
                        <td>{day.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ===== SECTION: LỊCH SỬ TIMELINE (Full Width Below) ===== */}
            {timeline.length > 0 && (
              <div className="wo-detail-section">
                <div className="wo-detail-section-title">
                  <BsClockHistory />
                  Lịch sử ra/vào khu vực làm việc
                </div>
                <div className="wo-detail-timeline">
                  {timeline.map((event, idx) => (
                    <TimelineEvent key={idx} event={event} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        {/* In PCT: ai cũng in được — bản giấy dùng để ký/đưa tay các bên */}
        {detail && (
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-auto"
            disabled={printing}
            title={isTerminalStatus(detail.status) && detail.pdfPath
              ? 'Mở bản lưu chốt sổ (phiếu đã kết thúc)'
              : 'Render bản in mới nhất của phiếu công tác'}
            onClick={handlePrintWorkOrder}
          >
            <BsPrinter className="me-1" /> {printing ? 'Đang in...' : 'In PCT'}
          </Button>
        )}
        {/* Mọi bước chuyển trạng thái (mở / khoá phiếu ngày, khoá hoàn thành,
            huỷ) nằm ở modal "Cập nhật trạng thái" ngoài danh sách PCT. */}
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          <BsXCircle className="me-1" /> Đóng
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Xác nhận thành viên rời khu vực làm việc */}
    <ConfirmModal
      show={!!leaveTarget}
      onClose={() => setLeaveTarget(null)}
      onConfirm={confirmLeave}
      title="Xác nhận rời khu vực"
      message={`Ghi nhận ${leaveTarget?.fullName || 'thành viên này'} rời khu vực làm việc?`}
      confirmText="Rời khu vực"
      variant="warning"
      loading={leaveLoading}
    >
      <div className="input-group input-group-sm mt-2">
        <span className="input-group-text"><BsClockHistory /></span>
        <input
          type="datetime-local"
          className="form-control"
          aria-label="Giờ rời khu vực làm việc"
          value={leaveTime}
          onChange={(e) => setLeaveTime(e.target.value)}
        />
      </div>
      <div className="form-text" style={{ fontSize: 'var(--text-xs)' }}>
        Giờ rời nhập tay (mặc định = hiện tại) — không lấy realtime.
      </div>
    </ConfirmModal>

    </>
  );
}

/* ============================================================
   HELPER COMPONENTS
   ============================================================ */

function InfoItem({ label, value, mono }) {
  return (
    <div className="wo-detail-info-item">
      <span className="wo-detail-info-label">{label}</span>
      <span className={`wo-detail-info-value ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

function InfoItemWithStatus({ label, value, isOnline }) {
  return (
    <div className="wo-detail-info-item">
      <span className="wo-detail-info-label">{label}</span>
      <span className="wo-detail-info-value">
        <span className={`wo-status-indicator ${isOnline ? 'online' : 'offline'}`}>
          <BsCircleFill />
        </span>
        {value || '—'}
      </span>
    </div>
  );
}

function MemberCardCompact({ member, isOnline, onLeave }) {
  return (
    <div className={`wo-detail-member-compact ${isOnline ? 'online' : 'offline'}`}>
      <div className="wo-detail-member-avatar-sm">
        {member.fullName?.charAt(0) || '?'}
      </div>
      <div className="wo-detail-member-info-sm">
        <div className="wo-detail-member-name-sm">{member.fullName || 'N/A'}</div>
        <div className="wo-detail-member-role-sm">{member.roleInTask || '—'}</div>
      </div>
      <span className={`wo-status-indicator-sm ${isOnline ? 'online' : 'offline'}`}>
        <BsCircleFill />
      </span>
      {onLeave && (
        <Button
          variant="outline-warning"
          size="sm"
          className="ms-1"
          title="Ghi nhận rời khu vực làm việc"
          onClick={onLeave}
        >
          <BsBoxArrowLeft />
        </Button>
      )}
    </div>
  );
}

function TimelineEvent({ event }) {
  const isJoined = event.eventType === 'JOINED';
  const icon = isJoined ? <BsBoxArrowInRight /> : <BsBoxArrowLeft />;
  const color = isJoined ? 'var(--color-status-normal)' : 'var(--color-status-warning)';
  const label = isJoined ? 'tham gia' : 'rời khỏi';

  return (
    <div className="wo-detail-timeline-event">
      <div className="wo-detail-timeline-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="wo-detail-timeline-content">
        <div className="wo-detail-timeline-text">
          <strong>{event.fullName}</strong> {label} khu vực làm việc
          {event.role && <span className="text-muted"> ({event.role})</span>}
        </div>
        <div className="wo-detail-timeline-time">{formatDateTime(event.eventTime)}</div>
      </div>
    </div>
  );
}

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

/** Ngày trần (LocalDate "yyyy-MM-dd") — không có giờ nên không dựng Date UTC. */
function formatDate(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = String(isoDate).split('-');
  return d && m && y ? `${d}/${m}/${y}` : String(isoDate);
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "2026-08-07T08:30:00" (ISO) → "2026-08-07T08:30" (giá trị datetime-local). */
function toLocalInput(iso) {
  if (!iso) return '';
  return iso.slice(0, 16);
}
