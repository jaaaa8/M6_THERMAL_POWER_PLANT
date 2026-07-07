import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Tabs, Tab } from 'react-bootstrap';
import {
  BsXCircle, BsCpu, BsPeopleFill, BsClockHistory,
  BsBoxArrowInRight, BsBoxArrowLeft, BsPersonBadge,
  BsCircleFill, BsPersonPlus, BsSearch,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmModal from '../common/ConfirmModal';
import { workOrderService } from '../../services/workOrderService';
import { employeeService } from '../../services/hr/employeeService';
import './WorkOrderDetailModal.css';

const STATUS_MAP = {
  OPEN: { label: 'Mới tạo', status: 'info' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
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
 */
export default function WorkOrderDetailModal({ show, onClose, workOrderId }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  if (!show) return null;

  // Chỉ cho thao tác thành viên khi phiếu còn hiệu lực
  const canManage = detail?.status === 'OPEN' || detail?.status === 'IN_PROGRESS';

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
