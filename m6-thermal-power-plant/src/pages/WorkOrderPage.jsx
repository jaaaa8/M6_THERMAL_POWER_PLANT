import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import {
  BsClipboard2Check,
  BsPlayCircle,
  BsPauseCircle,
  BsLockFill,
  BsArrowLeft,
  BsGearWideConnected,
  BsPersonBadge,
  BsCalendar3,
  BsClockHistory,
  BsPersonPlus,
  BsTrash,
  BsPeople,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  workOrderService,
  WORK_ORDER_STATUS,
  WO_STATUS_LABEL,
  WO_STATUS_VARIANT,
  AVAILABLE_WORKERS,
} from '../services/workOrderService';
import { authService } from '../services/authService';
import './WorkOrderPage.css';

const pad = (n) => String(n).padStart(2, '0');

/* --- Helpers thời gian --- */
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
const fmtDate = (ngay) => {
  if (!ngay) return '—';
  const [y, m, d] = ngay.split('-');
  return `${d}/${m}/${y}`;
};
const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const isoToTimeInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const timeInputToIso = (ngay, hhmm) => (hhmm ? `${ngay}T${hhmm}:00` : null);

// Số phút làm việc (gioRa null → tính tới hiện tại)
const workMinutes = (gioVao, gioRa) => {
  if (!gioVao) return 0;
  const start = new Date(gioVao);
  const end = gioRa ? new Date(gioRa) : new Date();
  return Math.max(0, Math.round((end - start) / 60000));
};
const fmtDuration = (mins) => `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;

export default function WorkOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null); // { type, title, message, variant }
  const [updating, setUpdating] = useState(false);
  const [addWorkerId, setAddWorkerId] = useState('');

  const currentUser = authService.getCurrentUser();
  const isTruongCa = currentUser?.role === 'TRUONG_CA' || currentUser?.role === 'ADMIN';

  const loadWorkOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await workOrderService.getById(id);
      setWorkOrder(res.data);
    } catch {
      setError('Không tìm thấy phiếu công tác');
      toast.error('Lỗi tải phiếu công tác');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkOrder();
  }, [loadWorkOrder]);

  const trangThai = workOrder?.trangThai;
  const sessions = useMemo(() => workOrder?.phienLamViec || [], [workOrder]);
  const activeSession = useMemo(
    () => sessions.find((s) => s.gioDong === null) || null,
    [sessions]
  );
  const closedSessions = useMemo(
    () => sessions.filter((s) => s.gioDong !== null),
    [sessions]
  );
  const canEditMembers = isTruongCa && trangThai === WORK_ORDER_STATUS.DANG_MO;

  // Tổng hợp giờ công theo từng nhân viên (phục vụ tính lương)
  const payroll = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      s.thanhVien.forEach((m) => {
        const cur = map.get(m.hoTen) || { hoTen: m.hoTen, chucVu: m.chucVu, phut: 0, dangLam: false };
        cur.phut += workMinutes(m.gioVao, m.gioRa);
        if (!m.gioRa) cur.dangLam = true;
        map.set(m.hoTen, cur);
      });
    });
    return [...map.values()].sort((a, b) => b.phut - a.phut);
  }, [sessions]);

  const availableToAdd = useMemo(() => {
    const existing = new Set((activeSession?.thanhVien || []).map((m) => m.hoTen));
    return AVAILABLE_WORKERS.filter((w) => !existing.has(w.hoTen));
  }, [activeSession]);

  /* --- Hành động trạng thái --- */
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      setUpdating(true);
      let res;
      if (confirmAction.type === 'OPEN') res = await workOrderService.openSession(id);
      else if (confirmAction.type === 'CLOSE') res = await workOrderService.closeSession(id);
      else if (confirmAction.type === 'LOCK') res = await workOrderService.lock(id);
      setWorkOrder(res.data);
      setConfirmAction(null);
      toast.success(`${confirmAction.title} thành công!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật phiếu');
    } finally {
      setUpdating(false);
    }
  };

  /* --- Quản lý thành viên --- */
  const handleAddMember = async () => {
    const worker = AVAILABLE_WORKERS.find((w) => w.id === Number(addWorkerId));
    if (!worker) return;
    try {
      const res = await workOrderService.addMember(id, worker);
      setWorkOrder(res.data);
      setAddWorkerId('');
      toast.success(`Đã thêm ${worker.hoTen}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm nhân viên');
    }
  };

  const handleRemoveMember = async (memberId, hoTen) => {
    try {
      const res = await workOrderService.removeMember(id, memberId);
      setWorkOrder(res.data);
      toast.info(`Đã xóa ${hoTen} khỏi phiên`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa nhân viên');
    }
  };

  // Sửa giờ vào/ra: cập nhật local ngay, commit khi blur
  const handleTimeChange = (memberId, field, hhmm) => {
    if (!activeSession) return;
    const iso = timeInputToIso(activeSession.ngay, hhmm);
    setWorkOrder((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const ses = next.phienLamViec.find((s) => s.id === activeSession.id);
      const m = ses?.thanhVien.find((x) => x.id === memberId);
      if (m) m[field] = iso;
      return next;
    });
  };

  const handleTimeCommit = async (memberId, field, hhmm) => {
    if (!activeSession) return;
    const iso = timeInputToIso(activeSession.ngay, hhmm);
    try {
      const res = await workOrderService.updateMemberTime(id, memberId, { [field]: iso });
      setWorkOrder(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật giờ');
      loadWorkOrder();
    }
  };

  /* --- Render states --- */
  if (loading) {
    return (
      <div>
        <PageHeader title="Phiếu Công tác" icon={<BsClipboard2Check />} />
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div>
        <PageHeader title="Phiếu Công tác" icon={<BsClipboard2Check />} />
        <div className="wo-error surface-card">
          <p className="text-danger">{error || 'Không tìm thấy dữ liệu'}</p>
          <Button variant="outline-primary" size="sm" onClick={() => navigate('/sua-chua/phieu-cong-tac')}>
            <BsArrowLeft className="me-1" /> Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const bannerText = {
    CHUA_MO: 'Phiếu chưa được mở. Trưởng ca bấm "Mở phiếu" để bắt đầu ca làm việc.',
    DANG_MO: 'Phiếu đang mở. Có thể thêm/bớt nhân viên và chấm giờ. Cuối ngày bấm "Đóng phiếu".',
    TAM_DONG: 'Đã đóng phiên trong ngày. Mở lại để làm tiếp, hoặc khóa phiếu khi đã hoàn thành.',
    DA_KHOA: 'Phiếu đã khóa (đơn vị sửa chữa hoàn thành). Không thể thay đổi.',
  };

  return (
    <div>
      <PageHeader
        title={`Phiếu Công tác ${workOrder.maPhieu}`}
        subtitle="Quản lý phiên làm việc theo ngày & chấm giờ nhân viên"
        icon={<BsClipboard2Check />}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/sua-chua/phieu-cong-tac')}>
            <BsArrowLeft className="me-1" /> Quay lại
          </Button>
        }
      />

      {/* Status Banner */}
      <div className={`wo-status-banner wo-status-${WO_STATUS_VARIANT[trangThai]}`}>
        <div className="wo-status-banner-left">
          <StatusBadge
            status={WO_STATUS_VARIANT[trangThai]}
            label={WO_STATUS_LABEL[trangThai]}
            pulse={trangThai === WORK_ORDER_STATUS.DANG_MO}
          />
          <span className="wo-status-banner-text">{bannerText[trangThai]}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="wo-actions">
        {/* Mở phiếu: CHUA_MO hoặc TAM_DONG, chỉ Trưởng ca */}
        {(trangThai === WORK_ORDER_STATUS.CHUA_MO || trangThai === WORK_ORDER_STATUS.TAM_DONG) && (
          <Button
            variant="primary"
            className="wo-action-btn"
            disabled={!isTruongCa}
            title={!isTruongCa ? 'Chỉ Trưởng ca / Admin được mở phiếu' : ''}
            onClick={() => setConfirmAction({
              type: 'OPEN',
              title: 'Mở phiếu công tác',
              message: 'Mở phiếu cho ngày làm việc hôm nay? Danh sách nhân viên sẽ kế thừa từ phiên gần nhất (có thể chỉnh sửa).',
              variant: 'primary',
            })}
          >
            <BsPlayCircle className="me-2" /> Mở phiếu (hôm nay)
            {!isTruongCa && <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>Chỉ Trưởng ca</Badge>}
          </Button>
        )}

        {/* Đóng phiếu: DANG_MO, chỉ Trưởng ca */}
        {trangThai === WORK_ORDER_STATUS.DANG_MO && (
          <Button
            variant="warning"
            className="wo-action-btn"
            disabled={!isTruongCa}
            title={!isTruongCa ? 'Chỉ Trưởng ca / Admin được đóng phiếu' : ''}
            onClick={() => setConfirmAction({
              type: 'CLOSE',
              title: 'Đóng phiếu công tác',
              message: 'Đóng phiên làm việc cuối ngày? Nhân viên chưa có giờ ra sẽ được chốt giờ ra = thời điểm đóng.',
              variant: 'warning',
            })}
          >
            <BsPauseCircle className="me-2" /> Đóng phiếu (cuối ngày)
          </Button>
        )}

        {/* Khóa phiếu: TAM_DONG, chỉ Trưởng ca (Task 38) */}
        {trangThai === WORK_ORDER_STATUS.TAM_DONG && (
          <Button
            variant="success"
            className="wo-action-btn"
            disabled={!isTruongCa}
            title={!isTruongCa ? 'Chỉ Trưởng ca / Admin được khóa phiếu' : ''}
            onClick={() => setConfirmAction({
              type: 'LOCK',
              title: 'Khóa phiếu / Nghiệm thu',
              message: 'Xác nhận đơn vị sửa chữa đã hoàn thành và khóa phiếu? Sau khi khóa, phiếu không thể thay đổi.',
              variant: 'primary',
            })}
          >
            <BsLockFill className="me-2" /> Khóa phiếu / Nghiệm thu
            {!isTruongCa && <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>Chỉ Trưởng ca</Badge>}
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <Row className="g-3 mb-4">
        <Col lg={6}>
          <Card className="wo-info-card">
            <Card.Header>
              <BsGearWideConnected className="me-2" style={{ color: 'var(--color-primary-600)' }} />
              Thông tin thiết bị
            </Card.Header>
            <Card.Body>
              <div className="wo-info-grid">
                <div className="wo-info-item">
                  <span className="wo-info-label">Mã KKS</span>
                  <code className="code-tag">{workOrder.maKKS}</code>
                </div>
                <div className="wo-info-item">
                  <span className="wo-info-label">Tên thiết bị</span>
                  <span className="wo-info-value">{workOrder.tenThietBi}</span>
                </div>
                <div className="wo-info-item wo-info-full">
                  <span className="wo-info-label">Mô tả công việc</span>
                  <span className="wo-info-value">{workOrder.moTaCongViec}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="wo-info-card">
            <Card.Header>
              <BsPersonBadge className="me-2" style={{ color: 'var(--color-accent)' }} />
              Nhân sự quản lý <span className="wo-fixed-tag">cố định</span>
            </Card.Header>
            <Card.Body>
              <div className="wo-info-grid">
                <div className="wo-info-item">
                  <span className="wo-info-label">Người chỉ huy</span>
                  <span className="wo-info-value">{workOrder.nguoiChiHuy}</span>
                </div>
                <div className="wo-info-item">
                  <span className="wo-info-label">Người giám sát an toàn</span>
                  <span className="wo-info-value">{workOrder.nguoiGiamSat}</span>
                </div>
                <div className="wo-info-item">
                  <span className="wo-info-label">Tổ trưởng</span>
                  <span className="wo-info-value">{workOrder.toTruong}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Phiên đang mở — quản lý thành viên & chấm giờ */}
      {activeSession && (
        <Card className="wo-info-card mb-4">
          <Card.Header className="wo-session-header">
            <span>
              <BsPeople className="me-2" style={{ color: 'var(--color-status-info)' }} />
              Phiên đang mở — ngày {fmtDate(activeSession.ngay)}
            </span>
            <span className="wo-session-meta">
              Mở lúc {fmtTime(activeSession.gioMo)} · {activeSession.nguoiMo}
            </span>
          </Card.Header>
          <Card.Body>
            <div className="data-table-scroll">
              <table className="data-table wo-member-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Chức vụ</th>
                    <th style={{ width: 120 }}>Giờ vào</th>
                    <th style={{ width: 120 }}>Giờ ra</th>
                    <th style={{ width: 90 }}>Tổng giờ</th>
                    {canEditMembers && <th style={{ width: 60 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {activeSession.thanhVien.length === 0 ? (
                    <tr>
                      <td colSpan={canEditMembers ? 6 : 5} className="text-muted text-center" style={{ padding: 'var(--space-4)' }}>
                        Chưa có nhân viên. {canEditMembers && 'Dùng ô bên dưới để thêm.'}
                      </td>
                    </tr>
                  ) : (
                    activeSession.thanhVien.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="wo-member-cell">
                            <div className="wo-member-avatar-sm">{m.hoTen.charAt(0)}</div>
                            {m.hoTen}
                          </div>
                        </td>
                        <td className="text-muted">{m.chucVu}</td>
                        <td>
                          {canEditMembers ? (
                            <Form.Control
                              type="time" size="sm" className="wo-time-input"
                              value={isoToTimeInput(m.gioVao)}
                              onChange={(e) => handleTimeChange(m.id, 'gioVao', e.target.value)}
                              onBlur={(e) => handleTimeCommit(m.id, 'gioVao', e.target.value)}
                            />
                          ) : fmtTime(m.gioVao)}
                        </td>
                        <td>
                          {canEditMembers ? (
                            <Form.Control
                              type="time" size="sm" className="wo-time-input"
                              value={isoToTimeInput(m.gioRa)}
                              onChange={(e) => handleTimeChange(m.id, 'gioRa', e.target.value)}
                              onBlur={(e) => handleTimeCommit(m.id, 'gioRa', e.target.value)}
                            />
                          ) : (m.gioRa ? fmtTime(m.gioRa) : <span className="wo-working">đang làm</span>)}
                        </td>
                        <td className="wo-hours">{fmtDuration(workMinutes(m.gioVao, m.gioRa))}</td>
                        {canEditMembers && (
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              title="Xóa khỏi phiên"
                              onClick={() => handleRemoveMember(m.id, m.hoTen)}
                            >
                              <BsTrash />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Thêm nhân viên */}
            {canEditMembers && (
              <div className="wo-add-member">
                <BsPersonPlus style={{ color: 'var(--color-primary-600)' }} />
                <Form.Select
                  size="sm" value={addWorkerId}
                  onChange={(e) => setAddWorkerId(e.target.value)}
                  className="wo-add-select"
                >
                  <option value="">— Chọn nhân viên để thêm —</option>
                  {availableToAdd.map((w) => (
                    <option key={w.id} value={w.id}>{w.hoTen} — {w.chucVu}</option>
                  ))}
                </Form.Select>
                <Button size="sm" variant="primary" onClick={handleAddMember} disabled={!addWorkerId}>
                  Thêm
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Bảng tổng hợp giờ công (tính lương) */}
      {payroll.length > 0 && (
        <Card className="wo-info-card mb-4">
          <Card.Header>
            <BsClockHistory className="me-2" style={{ color: 'var(--color-status-normal)' }} />
            Tổng hợp giờ công (toàn bộ phiên)
          </Card.Header>
          <Card.Body>
            <div className="data-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Chức vụ</th>
                    <th style={{ width: 140 }}>Tổng giờ công</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((p) => (
                    <tr key={p.hoTen}>
                      <td>{p.hoTen}</td>
                      <td className="text-muted">{p.chucVu}</td>
                      <td className="wo-hours">
                        {fmtDuration(p.phut)}
                        {p.dangLam && <span className="wo-working ms-2">(còn làm)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Lịch sử các phiên đã đóng */}
      {closedSessions.length > 0 && (
        <Card className="wo-info-card mb-4">
          <Card.Header>
            <BsCalendar3 className="me-2" style={{ color: 'var(--color-status-info)' }} />
            Lịch sử phiên làm việc ({closedSessions.length})
          </Card.Header>
          <Card.Body>
            {closedSessions.map((s) => (
              <div key={s.id} className="wo-closed-session">
                <div className="wo-closed-session-head">
                  <strong>Ngày {fmtDate(s.ngay)}</strong>
                  <span className="text-muted">{fmtTime(s.gioMo)} → {fmtTime(s.gioDong)}</span>
                </div>
                <div className="wo-closed-members">
                  {s.thanhVien.map((m) => (
                    <div key={m.id} className="wo-closed-member">
                      <span>{m.hoTen}</span>
                      <span className="text-muted">{fmtTime(m.gioVao)}–{fmtTime(m.gioRa)}</span>
                      <span className="wo-hours">{fmtDuration(workMinutes(m.gioVao, m.gioRa))}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Nhật ký hoạt động */}
      <Card className="wo-info-card mb-4">
        <Card.Header>
          <BsClockHistory className="me-2" style={{ color: 'var(--color-primary-600)' }} />
          Nhật ký hoạt động
        </Card.Header>
        <Card.Body>
          <div className="wo-timeline">
            {workOrder.nhatKy?.length > 0 ? (
              [...workOrder.nhatKy].reverse().map((log, idx) => (
                <div key={log.id} className={`wo-timeline-item ${idx === 0 ? 'latest' : ''}`}>
                  <div className="wo-timeline-dot" />
                  <div className="wo-timeline-content">
                    <div className="wo-timeline-header">
                      <strong>{log.hanhDong}</strong>
                      <span className="wo-timeline-time">{fmtDateTime(log.thoiGian)}</span>
                    </div>
                    <p className="wo-timeline-text">{log.ghiChu}</p>
                    <span className="wo-timeline-user">{log.nguoiThucHien}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Chưa có nhật ký</p>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Confirm Modal */}
      <ConfirmModal
        show={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText="Xác nhận"
        variant={confirmAction?.variant || 'primary'}
        loading={updating}
      />
    </div>
  );
}
