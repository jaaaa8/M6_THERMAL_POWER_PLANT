import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import {
  BsArrowRepeat, BsXCircle, BsPenFill, BsPlayCircle, BsPauseCircle,
  BsCheckCircle, BsSendCheck, BsTrash,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import StatusBadge from '../common/StatusBadge';
import { workOrderService } from '../../services/workOrderService';
import { authService } from '../../services/authService';

/**
 * WorkOrderStatusModal — modal "Cập nhật trạng thái" mở từ danh sách PCT.
 * Hiện trạng thái hiện tại + các bước chuyển hợp lệ (lọc theo vai trò, gating
 * chỉ ở UI như các nút cũ) theo máy trạng thái:
 *
 *   Chờ duyệt (OPEN) ─duyệt phiếu─► APPROVED ─bắt đầu─► IN_PROGRESS
 *   IN_PROGRESS ─làm không kịp─► STOPPED ─gửi duyệt gia hạn─►
 *   WAITING_FOR_APPROVAL ─duyệt gia hạn (ký bản giấy)─► APPROVED ─► ...
 *   ─► COMPLETED; mọi trạng thái sống ─huỷ─► CANCELLED.
 *
 * @param {boolean} props.show
 * @param {object}  props.workOrder - Dòng WorkOrderDTO từ danh sách
 * @param {Function} props.onClose
 * @param {Function} [props.onChanged] - Gọi sau khi đổi trạng thái thành công
 */

const STATUS_MAP = {
  OPEN: { label: 'Chờ duyệt', status: 'info' },
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  WAITING_FOR_APPROVAL: { label: 'Chờ duyệt gia hạn', status: 'warning' },
  APPROVED: { label: 'Đã duyệt', status: 'info' },
  STOPPED: { label: 'Tạm dừng', status: 'inactive' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
};

// MỌI bước chuyển trạng thái PCT (duyệt, mở/đóng hằng ngày, gia hạn, khoá,
// huỷ) thuộc Trưởng ca/kíp — khớp BE (WorkOrderController + MaintenanceService
// requireWorkOrderStatusRole). Quản đốc SC/Tổ trưởng chỉ quản lý hồ sơ phiếu.
const STATUS_ROLES = ['SHIFT_LEADER', 'CREW_LEADER', 'ADMIN'];
const OPERATE_ROLES = STATUS_ROLES;
const APPROVE_ROLES = STATUS_ROLES;

/**
 * Bảng chuyển trạng thái: option hiển thị theo trạng thái hiện tại.
 * roles: nhóm được bấm (gating UI); needsExtension: bắt buộc lý do + ngày
 * (tạo dòng gia hạn in lên bản giấy PCT đưa Trưởng ca ký).
 */
const TRANSITIONS = {
  OPEN: [
    {
      target: 'APPROVED', roles: APPROVE_ROLES, icon: <BsPenFill />, variant: 'warning',
      label: 'Duyệt phiếu',
      desc: 'Trưởng ca / Quản đốc duyệt, cho phép thực hiện công tác.',
    },
  ],
  APPROVED: [
    {
      target: 'IN_PROGRESS', roles: OPERATE_ROLES, icon: <BsPlayCircle />, variant: 'primary',
      label: 'Bắt đầu / tiếp tục làm việc',
      desc: 'Trưởng ca/kíp mở phiếu cho đội bắt đầu (hoặc làm tiếp sau gia hạn).',
    },
  ],
  IN_PROGRESS: [
    {
      target: 'COMPLETED', roles: OPERATE_ROLES, icon: <BsCheckCircle />, variant: 'success',
      label: 'Hoàn thành',
      desc: 'Toàn bộ công việc đã kết thúc — phiếu chốt sổ, không mở lại được.',
    },
    {
      target: 'STOPPED', roles: OPERATE_ROLES, icon: <BsPauseCircle />, variant: 'secondary',
      label: 'Tạm dừng (làm không kịp)',
      desc: 'Hết ngày / không kịp tiến độ — dừng lại, hôm sau gửi duyệt gia hạn.',
    },
  ],
  STOPPED: [
    {
      target: 'WAITING_FOR_APPROVAL', roles: OPERATE_ROLES, icon: <BsSendCheck />, variant: 'warning',
      label: 'Gửi duyệt gia hạn', needsExtension: true,
      desc: 'Xin phép làm tiếp — lý do + ngày được in lên bản giấy PCT đưa Trưởng ca ký.',
    },
    {
      target: 'COMPLETED', roles: OPERATE_ROLES, icon: <BsCheckCircle />, variant: 'success',
      label: 'Hoàn thành',
      desc: 'Nghiệm lại thấy công việc đã xong — chốt sổ luôn, không cần gia hạn.',
    },
  ],
  WAITING_FOR_APPROVAL: [
    {
      target: 'APPROVED', roles: APPROVE_ROLES, icon: <BsPenFill />, variant: 'warning',
      label: 'Duyệt gia hạn (Trưởng ca đã ký bản giấy)',
      desc: 'Chỉ bấm khi ĐANG CẦM bản giấy có chữ ký — tài khoản của bạn được ghi vào mục "Người cho phép".',
    },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

// Huỷ phiếu được phép từ mọi trạng thái sống (thêm vào cuối mỗi danh sách).
const CANCEL_OPTION = {
  target: 'CANCELLED', roles: OPERATE_ROLES, icon: <BsTrash />, variant: 'danger',
  label: 'Huỷ phiếu',
  desc: 'Huỷ VĨNH VIỄN — yêu cầu sửa chữa quay lại hàng chờ để tạo phiếu mới.',
};

export default function WorkOrderStatusModal({ show, workOrder, onClose, onChanged }) {
  // Parent truyền key={workOrder.id} → mỗi phiếu là một instance mới, state
  // tự sạch khi đổi dòng (không cần reset trong effect).
  const [selected, setSelected] = useState(null); // target status đã chọn
  const [reason, setReason] = useState('');
  const [extendedUntil, setExtendedUntil] = useState(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);

  const userRoles = authService.getCurrentUser()?.roles || [];
  const status = workOrder?.status;
  const isTerminal = status === 'COMPLETED' || status === 'CANCELLED';

  // Option theo trạng thái + lọc theo vai trò người đang đăng nhập.
  const options = [...(TRANSITIONS[status] || []), ...(isTerminal ? [] : [CANCEL_OPTION])]
    .filter((o) => o.roles.some((r) => userRoles.includes(r)));

  const selectedOption = options.find((o) => o.target === selected);

  const submit = async () => {
    if (!selectedOption) return;
    if (selectedOption.needsExtension) {
      if (!reason.trim()) {
        toast.warning('Phải nhập lý do — lý do được in lên bản giấy đưa Trưởng ca ký');
        return;
      }
      if (!extendedUntil) {
        toast.warning('Phải chọn ngày xin phép làm việc đến');
        return;
      }
    }
    setSaving(true);
    try {
      await workOrderService.updateStatus(workOrder.id, {
        targetStatus: selectedOption.target,
        // Xin phép đến CUỐI ngày đã chọn (backend lưu LocalDateTime).
        reason: selectedOption.needsExtension ? reason.trim() : null,
        extendedUntil: selectedOption.needsExtension ? `${extendedUntil}T23:59:59` : null,
      });
      toast.success(`${workOrder.orderCode}: ${STATUS_MAP[status]?.label || status} → ${STATUS_MAP[selectedOption.target]?.label || selectedOption.target}`);
      onClose();
      onChanged?.();
    } catch (err) {
      const data = err.response?.data;
      const msg = (typeof data === 'string' && data.trim()) ? data : (data?.message || err.message);
      toast.error(`Không thể cập nhật trạng thái: ${msg}`, { autoClose: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const current = STATUS_MAP[status] || { label: status, status: 'info' };

  return (
    <Modal show={show} onHide={() => !saving && onClose()} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsArrowRepeat className="me-2" style={{ color: 'var(--color-primary)' }} />
          Cập nhật trạng thái — {workOrder?.orderCode}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3 d-flex align-items-center gap-2">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Trạng thái hiện tại:
          </span>
          <StatusBadge status={current.status} label={current.label} />
        </div>

        {isTerminal ? (
          <div className="alert alert-secondary" style={{ fontSize: 'var(--text-sm)' }}>
            Phiếu đã {status === 'COMPLETED' ? 'hoàn thành' : 'huỷ'} — chứng từ đã chốt,
            không thể chuyển trạng thái nữa.
          </div>
        ) : options.length === 0 ? (
          <div className="alert alert-secondary" style={{ fontSize: 'var(--text-sm)' }}>
            Tài khoản của bạn không có quyền chuyển trạng thái phiếu — chỉ
            Trưởng ca / Trưởng kíp (hoặc Admin) được duyệt, mở/đóng, khoá phiếu.
          </div>
        ) : (
          <>
            {options.map((o) => (
              <Form.Check
                key={o.target}
                type="radio"
                id={`wo-status-${o.target}`}
                name="wo-status-option"
                className="mb-2 p-3 border rounded"
                style={{
                  paddingLeft: '2.5rem',
                  cursor: 'pointer',
                  borderColor: selected === o.target ? 'var(--color-primary)' : undefined,
                }}
                checked={selected === o.target}
                onChange={() => setSelected(o.target)}
                label={
                  <div style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
                      <span className={`me-1 text-${o.variant}`}>{o.icon}</span> {o.label}
                      <span className="ms-2">
                        <StatusBadge
                          status={STATUS_MAP[o.target]?.status || 'info'}
                          label={STATUS_MAP[o.target]?.label || o.target}
                        />
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {o.desc}
                    </div>
                  </div>
                }
              />
            ))}

            {/* Lý do + ngày gia hạn — chỉ khi gửi duyệt gia hạn */}
            {selectedOption?.needsExtension && (
              <div className="mt-3 p-3 border rounded" style={{ background: 'var(--color-surface-container)' }}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                    Lý do gia hạn / xin làm tiếp <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="VD: Khối lượng còn lại nhiều, xin tiếp tục hôm nay..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                    Xin phép làm việc đến ngày <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={extendedUntil}
                    onChange={(e) => setExtendedUntil(e.target.value)}
                  />
                </Form.Group>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" disabled={saving} onClick={onClose}>
          <BsXCircle className="me-1" /> Đóng
        </Button>
        {!isTerminal && options.length > 0 && (
          <Button
            variant={selectedOption?.variant || 'primary'}
            size="sm"
            disabled={!selectedOption || saving}
            onClick={submit}
          >
            {saving ? 'Đang lưu...' : (selectedOption ? selectedOption.label : 'Chọn một hành động')}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
