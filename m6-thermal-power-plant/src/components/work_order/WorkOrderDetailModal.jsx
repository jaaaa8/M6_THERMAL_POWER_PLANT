import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Tabs, Tab, Form } from 'react-bootstrap';
import {
  BsXCircle, BsCpu, BsPeopleFill, BsClockHistory,
  BsBoxArrowInRight, BsBoxArrowLeft, BsPersonBadge,
  BsCircleFill, BsPersonPlus, BsSearch,
  BsPlayCircle, BsPauseCircle, BsCheckCircle, BsPenFill, BsCalendarWeek,
  BsPrinter, BsPencilSquare,
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
  OPEN: { label: 'Mới tạo', status: 'info' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  WAITING_FOR_APPROVAL: { label: 'Chờ Trưởng ca duyệt', status: 'warning' },
  APPROVED: { label: 'Đã duyệt — chờ làm tiếp', status: 'info' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
};

/**
 * Gating theo vai trò (chỉ ở UI — backend không chặn, nhất quán các endpoint cũ):
 * - OPERATE: Tổ trưởng bấm gửi duyệt / tạm dừng / mở lại / hoàn thành / chỉnh sửa.
 * - APPROVE: người xác nhận online việc Trưởng ca ĐÃ ký bản giấy (môi trường
 *   nguy hiểm nên bước duyệt là chữ ký thật trên giấy, đưa tận tay).
 */
const OPERATE_ROLES = ['TEAM_LEADER', 'ADMIN'];
const APPROVE_ROLES = ['SHIFT_LEADER', 'WORKSHOP_FOREMAN', 'ADMIN'];

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
 * @param {Function} [props.onChanged] - Gọi sau khi status phiếu thay đổi (để list refetch)
 */
export default function WorkOrderDetailModal({ show, onClose, workOrderId, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chuyển trạng thái phiếu: 'start' | 'resume' | 'approve' | 'complete' (confirm)
  // + form tạm dừng cuối ngày riêng (cần lý do + ngày).
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStopForm, setShowStopForm] = useState(false);
  const [stopReason, setStopReason] = useState('');
  const [stopUntil, setStopUntil] = useState('');
  const [printing, setPrinting] = useState(false);

  // Chỉnh sửa thông tin phiếu — hiện trường thay đổi liên tục nên mọi trường
  // đều sửa được khi phiếu còn sống (backend chỉ chặn COMPLETED/CANCELLED).
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Quản lý thành viên (rời / thêm mới)
  const [memberTab, setMemberTab] = useState('members');
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [employees, setEmployees] = useState(null); // null = chưa tải
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [addingEmployeeId, setAddingEmployeeId] = useState(null);

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
      // API returns { workOrder: {...}, memberHistory: [...], sparePartsIssues: [...] }
      const data = res.data;
      // Flatten the structure for easier access
      const flattenedDetail = {
        ...data.workOrder,
        memberHistory: data.memberHistory || [],
        sparePartsIssues: data.sparePartsIssues || [],
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
    loadDetail();
  }, [show, workOrderId, loadDetail]);

  // Tải danh sách nhân viên khi mở tab "Thêm thành viên" HOẶC form chỉnh sửa
  // lần đầu (backend không có endpoint search — tải hết rồi lọc phía client).
  useEffect(() => {
    if (!show || (memberTab !== 'add' && !showEditForm) || employees !== null || employeesLoading) return;
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
  }, [show, memberTab, showEditForm, employees, employeesLoading]);

  // Nhân viên hiển thị trong tab thêm: loại người ĐANG trong khu vực làm việc
  // (người đã rời vẫn hiện — backend cho phép vào lại).
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    const activeIds = new Set(
      (detail?.currentMembers || []).filter((m) => !m.leftAt).map((m) => m.employeeId)
    );
    const q = empSearch.trim().toLowerCase();
    return employees
      .filter((e) => e.isActive !== false && !activeIds.has(e.id))
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
  }, [employees, detail, empSearch]);

  const confirmLeave = async () => {
    if (!leaveTarget) return;
    setLeaveLoading(true);
    try {
      await workOrderService.leaveMember(workOrderId, leaveTarget.id);
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
      await workOrderService.addMember(workOrderId, emp.id);
      toast.success(`Đã thêm ${emp.fullName} vào phiếu công tác`);
      await loadDetail(true);
    } catch (err) {
      toast.error(`Không thể thêm thành viên: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setAddingEmployeeId(null);
    }
  };

  /* ============================================================
     CHUYỂN TRẠNG THÁI PHIẾU (start / stop / approve / resume / complete)
     ============================================================ */

  // Nội dung confirm cho các hành động 1-click (tạm dừng có form riêng).
  const ACTION_CONFIG = {
    start: {
      title: 'Bắt đầu làm việc',
      message: `Bắt đầu thực hiện phiếu công tác ${detail?.orderCode}? Trạng thái chuyển sang "Đang thực hiện".`,
      confirmText: 'Bắt đầu',
      variant: 'primary',
      run: () => workOrderService.reopen(workOrderId),
      successMsg: 'Phiếu công tác đã chuyển sang Đang thực hiện',
    },
    resume: {
      title: 'Tiếp tục làm việc',
      message: `Gia hạn của phiếu ${detail?.orderCode} đã được duyệt. Mở lại để tiếp tục làm việc hôm nay?`,
      confirmText: 'Tiếp tục làm việc',
      variant: 'primary',
      run: () => workOrderService.reopen(workOrderId),
      successMsg: 'Phiếu công tác đã mở lại — Đang thực hiện',
    },
    approve: {
      title: 'Xác nhận Trưởng ca đã duyệt',
      message: `Chỉ bấm khi bạn ĐANG CẦM bản giấy phiếu ${detail?.orderCode} có chữ ký duyệt của Trưởng ca. `
        + 'Tài khoản của bạn sẽ được ghi vào mục "Người cho phép" — bạn chịu trách nhiệm nhập đúng theo bản giấy.',
      confirmText: 'Đã có chữ ký — xác nhận',
      variant: 'warning',
      run: () => workOrderService.approveExtension(workOrderId),
      successMsg: 'Đã ghi nhận duyệt gia hạn — Tổ trưởng có thể mở lại phiếu',
    },
    complete: {
      title: 'Hoàn thành phiếu công tác',
      message: `Xác nhận toàn bộ công việc của phiếu ${detail?.orderCode} đã kết thúc? Phiếu hoàn thành không thể mở lại.`,
      confirmText: 'Hoàn thành',
      variant: 'success',
      run: () => workOrderService.complete(workOrderId),
      successMsg: 'Phiếu công tác đã hoàn thành',
    },
  };

  const runConfirmAction = async () => {
    const config = ACTION_CONFIG[confirmAction];
    if (!config) return;
    setActionLoading(true);
    try {
      await config.run();
      toast.success(config.successMsg);
      setConfirmAction(null);
      await loadDetail(true);
      onChanged?.();
    } catch (err) {
      toast.error(`Không thể thực hiện: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setActionLoading(false);
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

  // Từ OPEN: Tổ trưởng GỬI DUYỆT phiếu xin Trưởng ca / Quản đốc cho phép làm
  // việc; từ IN_PROGRESS/APPROVED: tạm dừng cuối ngày xin làm tiếp. Cùng một
  // API stop — đều tạo dòng gia hạn in lên bản giấy để ký duyệt.
  const stopIsRequest = detail?.status === 'OPEN';

  const openStopForm = () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setStopReason('');
    setStopUntil(tomorrow.toISOString().slice(0, 10));
    setShowStopForm(true);
  };

  const submitStop = async () => {
    if (!stopReason.trim()) {
      toast.warning('Phải nhập lý do — lý do được in lên bản giấy đưa Trưởng ca ký');
      return;
    }
    if (!stopUntil) {
      toast.warning('Phải chọn ngày xin phép làm việc đến');
      return;
    }
    setActionLoading(true);
    try {
      // Xin phép đến CUỐI ngày đã chọn (backend lưu LocalDateTime).
      await workOrderService.stop(workOrderId, stopReason.trim(), `${stopUntil}T23:59:59`);
      toast.success(stopIsRequest
        ? 'Đã gửi duyệt — in bản PCT và đưa Trưởng ca ký'
        : 'Đã tạm dừng phiếu — in bản PCT mới và đưa Trưởng ca ký duyệt gia hạn');
      setShowStopForm(false);
      await loadDetail(true);
      onChanged?.();
    } catch (err) {
      toast.error(`Không thể gửi duyệt: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
     CHỈNH SỬA THÔNG TIN PHIẾU (mọi trường — phiếu còn sống)
     ============================================================ */

  const toLocalInput = (iso) => (iso ? iso.slice(0, 16) : '');

  const openEditForm = () => {
    setEditForm({
      leaderId: detail?.leaderId ?? '',
      directSupervisorId: detail?.directSupervisorId ?? '',
      safetySupervisorId: detail?.safetySupervisorId ?? '',
      startTime: toLocalInput(detail?.startTime),
      expectedEndTime: toLocalInput(detail?.expectedEndTime),
      repairDescription: detail?.repairDescription || '',
    });
    setShowEditForm(true);
  };

  const setEditField = (field, value) => setEditForm((f) => ({ ...f, [field]: value }));

  const submitEdit = async () => {
    setSavingEdit(true);
    try {
      // Partial update: trường bỏ trống gửi null → backend giữ nguyên giá trị cũ.
      await workOrderService.update(workOrderId, {
        leaderId: editForm.leaderId ? Number(editForm.leaderId) : null,
        directSupervisorId: editForm.directSupervisorId ? Number(editForm.directSupervisorId) : null,
        safetySupervisorId: editForm.safetySupervisorId ? Number(editForm.safetySupervisorId) : null,
        startTime: editForm.startTime ? `${editForm.startTime}:00` : null,
        expectedEndTime: editForm.expectedEndTime ? `${editForm.expectedEndTime}:00` : null,
        repairDescription: editForm.repairDescription?.trim() || null,
      });
      toast.success('Đã cập nhật phiếu công tác');
      setShowEditForm(false);
      await loadDetail(true);
      onChanged?.();
    } catch (err) {
      toast.error(`Không thể cập nhật: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setSavingEdit(false);
    }
  };

  if (!show) return null;

  // Cho thao tác thành viên / chỉnh sửa với MỌI phiếu còn sống — chỉ phiếu đã
  // kết thúc (COMPLETED/CANCELLED, chứng từ đã chốt) mới khoá.
  const canManage = detail ? !['COMPLETED', 'CANCELLED'].includes(detail.status) : false;

  // Gating theo vai trò của tài khoản đang đăng nhập (chỉ ở UI).
  const userRoles = authService.getCurrentUser()?.roles || [];
  const canOperate = userRoles.some((r) => OPERATE_ROLES.includes(r));
  const canApprove = userRoles.some((r) => APPROVE_ROLES.includes(r));

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
          <BsCpu className="me-2" style={{ color: 'var(--color-primary-500)' }} />
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
                  <div className="wo-detail-info-grid">
                    <InfoItem label="Mã KKS" value={detail.equipmentKksCode} mono />
                    <InfoItem label="Tên thiết bị" value={detail.equipmentName} />
                    <InfoItem label="Mã yêu cầu" value={detail.requestCode} mono />
                    <InfoItem label="Mô tả" value={detail.repairDescription} />
                  </div>
                </div>

                {/* ===== SECTION: NHÂN SỰ QUẢN LÝ ===== */}
                <div className="wo-detail-section">
                  <div className="wo-detail-section-title">
                    <BsPersonBadge />
                    Nhân sự phụ trách
                  </div>
                  <div className="wo-detail-info-grid">
                    <InfoItemWithStatus 
                      label="Người chỉ huy" 
                      value={detail.leaderName}
                      isOnline={!leaderMember?.leftAt}
                    />
                    <InfoItemWithStatus 
                      label="Người giám sát" 
                      value={detail.directSupervisorName}
                      isOnline={!supervisorMember?.leftAt}
                    />
                    <InfoItemWithStatus 
                      label="Tổ trưởng" 
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
                    <InfoItem label="Ngày kết thúc" value={formatDateTime(detail.expectedEndTime)} />
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
                              onLeave={canManage && !m.leftAt ? () => setLeaveTarget(m) : undefined}
                            />
                          ))}
                        </div>
                      )}
                    </Tab>
                    {canManage && (
                      <Tab
                        eventKey="add"
                        title={<span><BsPersonPlus className="me-1" />Thêm thành viên</span>}
                      >
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

            {/* ===== SECTION: TẠM DỪNG / GIA HẠN HÀNG NGÀY ===== */}
            {(detail.extensions || []).length > 0 && (
              <div className="wo-detail-section">
                <div className="wo-detail-section-title">
                  <BsCalendarWeek />
                  Tạm dừng cuối ngày / gia hạn ({detail.extensions.length})
                </div>
                <div className="text-muted mb-2" style={{ fontSize: 'var(--text-xs)' }}>
                  Trưởng ca duyệt bằng chữ ký thật trên bản giấy PCT; cột "Người xác nhận"
                  là tài khoản đã nhập lại kết quả duyệt vào hệ thống.
                </div>
                <table className="table table-sm table-bordered mb-0" style={{ fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Lý do</th>
                      <th style={{ width: 160 }}>Xin phép đến</th>
                      <th style={{ width: 190 }}>Người xác nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.extensions.map((ext, idx) => (
                      <tr key={ext.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td>{ext.reason || '—'}</td>
                        <td>{formatDateTime(ext.extendedUntil)}</td>
                        <td>
                          {ext.approvedByName
                            ? <span><BsPenFill className="me-1" style={{ color: 'var(--color-status-normal)' }} />{ext.approvedByName}</span>
                            : <span className="text-muted fst-italic">Chờ Trưởng ca ký bản giấy...</span>}
                        </td>
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
        {/* Chỉnh sửa: mọi trường của phiếu còn sống (hiện trường thay đổi liên tục) */}
        {detail && canOperate && canManage && (
          <Button variant="outline-primary" size="sm" onClick={openEditForm}>
            <BsPencilSquare className="me-1" /> Chỉnh sửa
          </Button>
        )}
        {/* ===== HÀNH ĐỘNG THEO TRẠNG THÁI (gating vai trò ở UI) ===== */}
        {detail && canOperate && detail.status === 'OPEN' && (
          <Button variant="primary" size="sm" onClick={() => setConfirmAction('start')}>
            <BsPlayCircle className="me-1" /> Bắt đầu làm việc
          </Button>
        )}
        {detail && canOperate && ['OPEN', 'IN_PROGRESS', 'APPROVED'].includes(detail.status) && (
          <Button
            variant="outline-warning"
            size="sm"
            title={stopIsRequest
              ? 'Gửi phiếu xin Trưởng ca / Quản đốc cho phép làm việc — ký duyệt trên bản giấy'
              : 'Kết thúc công tác hôm nay, xin phép làm tiếp — chờ Trưởng ca ký duyệt bản giấy'}
            onClick={openStopForm}
          >
            {stopIsRequest
              ? <><BsPenFill className="me-1" /> Gửi Trưởng ca duyệt</>
              : <><BsPauseCircle className="me-1" /> Tạm dừng cuối ngày</>}
          </Button>
        )}
        {detail && canOperate && detail.status === 'IN_PROGRESS' && (
          <Button variant="success" size="sm" onClick={() => setConfirmAction('complete')}>
            <BsCheckCircle className="me-1" /> Hoàn thành
          </Button>
        )}
        {detail && canApprove && detail.status === 'WAITING_FOR_APPROVAL' && (
          <Button variant="warning" size="sm" onClick={() => setConfirmAction('approve')}>
            <BsPenFill className="me-1" /> Trưởng ca đã duyệt (bản giấy)
          </Button>
        )}
        {detail && canOperate && detail.status === 'APPROVED' && (
          <Button variant="primary" size="sm" onClick={() => setConfirmAction('resume')}>
            <BsPlayCircle className="me-1" /> Tiếp tục làm việc
          </Button>
        )}
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
    />

    {/* Xác nhận chuyển trạng thái (bắt đầu / tiếp tục / duyệt / hoàn thành) */}
    <ConfirmModal
      show={!!confirmAction}
      onClose={() => setConfirmAction(null)}
      onConfirm={runConfirmAction}
      title={ACTION_CONFIG[confirmAction]?.title || ''}
      message={ACTION_CONFIG[confirmAction]?.message || ''}
      confirmText={ACTION_CONFIG[confirmAction]?.confirmText || 'Xác nhận'}
      variant={ACTION_CONFIG[confirmAction]?.variant || 'primary'}
      loading={actionLoading}
    />

    {/* Form gửi duyệt (phiếu OPEN) / tạm dừng cuối ngày: lý do + xin phép đến ngày */}
    <Modal show={showStopForm} onHide={() => !actionLoading && setShowStopForm(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsPauseCircle className="me-2" style={{ color: 'var(--color-status-warning)' }} />
          {stopIsRequest ? 'Gửi Trưởng ca duyệt' : 'Tạm dừng cuối ngày'} — {detail?.orderCode}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-warning" style={{ fontSize: 'var(--text-sm)' }}>
          Sau khi gửi, phiếu chuyển sang <strong>Chờ Trưởng ca duyệt</strong>.
          Việc duyệt được thực hiện <strong>bằng chữ ký thật trên bản giấy PCT</strong> (in
          bản PDF mới — lý do và ngày dưới đây được in vào mục "Cho phép làm việc và kết
          thúc công tác hàng ngày") rồi mới được xác nhận lại trên hệ thống.
        </div>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
            {stopIsRequest ? 'Lý do xin phép làm việc' : 'Lý do tạm dừng / xin làm tiếp'}{' '}
            <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder={stopIsRequest
              ? 'VD: Xin phép thực hiện công tác sửa chữa theo phiếu...'
              : 'VD: Hết giờ làm việc, khối lượng còn lại xin tiếp tục ngày mai...'}
            value={stopReason}
            onChange={(e) => setStopReason(e.target.value)}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
            Xin phép làm việc đến ngày <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            type="date"
            value={stopUntil}
            onChange={(e) => setStopUntil(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" disabled={actionLoading}
                onClick={() => setShowStopForm(false)}>
          <BsXCircle className="me-1" /> Huỷ
        </Button>
        <Button variant="warning" size="sm" disabled={actionLoading} onClick={submitStop}>
          <BsPauseCircle className="me-1" />{' '}
          {actionLoading ? 'Đang lưu...' : (stopIsRequest ? 'Gửi duyệt' : 'Tạm dừng phiếu')}
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Form chỉnh sửa phiếu: mọi trường sửa được khi phiếu còn sống — hiện
        trường không ổn định nên KHÔNG áp ràng buộc lúc tạo (trùng vai trò,
        chồng lấn giờ). Trường bỏ trống giữ nguyên giá trị cũ. */}
    <Modal show={showEditForm} onHide={() => !savingEdit && setShowEditForm(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsPencilSquare className="me-2" style={{ color: 'var(--color-primary-500)' }} />
          Chỉnh sửa phiếu — {detail?.orderCode}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editForm && (
          <>
            <EmployeeSelect
              label="Người lãnh đạo công việc"
              value={editForm.leaderId}
              onChange={(v) => setEditField('leaderId', v)}
              employees={employees}
              loading={employeesLoading}
            />
            <EmployeeSelect
              label="Chỉ huy trực tiếp"
              value={editForm.directSupervisorId}
              onChange={(v) => setEditField('directSupervisorId', v)}
              employees={employees}
              loading={employeesLoading}
            />
            <EmployeeSelect
              label="Người giám sát an toàn"
              value={editForm.safetySupervisorId}
              onChange={(v) => setEditField('safetySupervisorId', v)}
              employees={employees}
              loading={employeesLoading}
            />
            <div className="row">
              <Form.Group className="mb-3 col-6">
                <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                  Bắt đầu
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  size="sm"
                  value={editForm.startTime}
                  onChange={(e) => setEditField('startTime', e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3 col-6">
                <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                  Dự kiến kết thúc
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  size="sm"
                  value={editForm.expectedEndTime}
                  onChange={(e) => setEditField('expectedEndTime', e.target.value)}
                />
              </Form.Group>
            </div>
            <Form.Group>
              <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                Mô tả nội dung sửa chữa
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editForm.repairDescription}
                onChange={(e) => setEditField('repairDescription', e.target.value)}
              />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" disabled={savingEdit}
                onClick={() => setShowEditForm(false)}>
          <BsXCircle className="me-1" /> Huỷ
        </Button>
        <Button variant="primary" size="sm" disabled={savingEdit} onClick={submitEdit}>
          <BsCheckCircle className="me-1" /> {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
}

/** Select nhân viên cho form chỉnh sửa — dùng chung danh sách employees đã tải. */
function EmployeeSelect({ label, value, onChange, employees, loading }) {
  return (
    <Form.Group className="mb-3">
      <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
        {label}
      </Form.Label>
      <Form.Select
        size="sm"
        value={value ?? ''}
        disabled={loading || employees === null}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {loading || employees === null ? 'Đang tải danh sách nhân viên...' : '— Giữ nguyên —'}
        </option>
        {(employees || [])
          .filter((e) => e.isActive !== false)
          .map((e) => (
            <option key={e.id} value={e.id}>
              {e.fullName}{e.employeeCode ? ` (${e.employeeCode})` : ''}
            </option>
          ))}
      </Form.Select>
    </Form.Group>
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

function MemberCard({ member, isOnline }) {
  return (
    <div className={`wo-detail-member-card ${isOnline ? 'online' : 'offline'}`}>
      <div className="wo-detail-member-avatar">
        {member.fullName?.charAt(0) || '?'}
        <span className={`wo-detail-member-status ${isOnline ? 'online' : 'offline'}`}>
          <BsCircleFill />
        </span>
      </div>
      <div className="wo-detail-member-info">
        <div className="wo-detail-member-name">{member.fullName || 'N/A'}</div>
        <div className="wo-detail-member-role">{member.roleInTask || '—'}</div>
        <div className="wo-detail-member-time">
          <span>Vào: {formatTime(member.joinedAt)}</span>
          {member.leftAt && (
            <>
              <span className="mx-1">•</span>
              <span>Rời: {formatTime(member.leftAt)}</span>
            </>
          )}
        </div>
      </div>
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

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
