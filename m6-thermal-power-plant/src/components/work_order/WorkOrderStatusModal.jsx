import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import {
  BsArrowRepeat, BsXCircle, BsPlayCircle, BsPauseCircle,
  BsCheckCircle, BsTrash,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import StatusBadge from '../common/StatusBadge';
import { workOrderService } from '../../services/workOrderService';
import { authService } from '../../services/authService';
import { OPERATE_ROLES, CANCEL_ROLES, canCancel } from './workOrderPermissions';

/**
 * WorkOrderStatusModal — modal "Cập nhật trạng thái" mở từ danh sách PCT.
 * Hiện trạng thái hiện tại + các bước chuyển hợp lệ (lọc theo vai trò, gating
 * chỉ ở UI — backend chặn thật) theo máy trạng thái:
 *
 *   Tạm dừng (STOPPED) ─mở phiếu ngày─► IN_PROGRESS ─khoá phiếu ngày─► STOPPED
 *                                             └─khoá phiếu hoàn thành─► COMPLETED
 *   STOPPED ─huỷ (chưa chạy ngày nào, đúng người tạo)─► CANCELLED.
 *
 * @param {boolean} props.show
 * @param {object}  props.workOrder - Dòng WorkOrderDTO từ danh sách
 * @param {Function} props.onClose
 * @param {Function} [props.onChanged] - Gọi sau khi đổi trạng thái thành công
 */

const STATUS_MAP = {
  IN_PROGRESS: { label: 'Đang thực hiện', status: 'warning' },
  STOPPED: { label: 'Tạm dừng', status: 'inactive' },
  COMPLETED: { label: 'Hoàn thành', status: 'normal' },
  CANCELLED: { label: 'Đã huỷ', status: 'inactive' },
};

/**
 * Bảng chuyển trạng thái: option hiển thị theo trạng thái hiện tại.
 * roles: nhóm được bấm (gating UI); allowsNote: hiện ô ghi chú (không bắt buộc).
 */
const TRANSITIONS = {
  STOPPED: [
    {
      target: 'IN_PROGRESS', roles: OPERATE_ROLES, icon: <BsPlayCircle />, variant: 'primary',
      label: 'Mở phiếu ngày',
      desc: 'Cho đội vào làm hôm nay — lần mở đầu tiên chính là bắt đầu phiếu.',
    },
  ],
  IN_PROGRESS: [
    {
      target: 'STOPPED', roles: OPERATE_ROLES, icon: <BsPauseCircle />, variant: 'secondary',
      label: 'Khoá phiếu ngày', allowsNote: true,
      desc: 'Hết ngày mà chưa xong việc — đóng ngày công tác, hôm sau mở lại.',
    },
    {
      target: 'COMPLETED', roles: OPERATE_ROLES, icon: <BsCheckCircle />, variant: 'success',
      label: 'Khoá phiếu hoàn thành',
      desc: 'Công việc sửa chữa đã xong — phiếu chốt sổ, không mở lại được.',
    },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

// Huỷ phiếu chỉ hiện khi phiếu CHƯA chạy ngày nào (xem canCancel bên dưới).
const CANCEL_OPTION = {
  target: 'CANCELLED', roles: CANCEL_ROLES, icon: <BsTrash />, variant: 'danger',
  label: 'Huỷ phiếu',
  desc: 'Huỷ VĨNH VIỄN — yêu cầu sửa chữa quay lại hàng chờ để tạo phiếu mới.',
};

export default function WorkOrderStatusModal({ show, workOrder, onClose, onChanged }) {
  // Parent truyền key={workOrder.id} → mỗi phiếu là một instance mới, state
  // tự sạch khi đổi dòng (không cần reset trong effect).
  const [selected, setSelected] = useState(null); // target status đã chọn
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  // Phiếu đã chạy ngày công tác nào chưa — danh sách KHÔNG trả nhật ký ngày nên
  // phải lấy chi tiết. Chỉ cần khi đang cân nhắc hiện nút Huỷ.
  const [ranAWorkDay, setRanAWorkDay] = useState(false);

  const userRoles = authService.getCurrentUser()?.roles || [];
  const status = workOrder?.status;
  const isTerminal = status === 'COMPLETED' || status === 'CANCELLED';
  const cancellable = canCancel(workOrder, userRoles);

  useEffect(() => {
    if (!show || !cancellable || !workOrder?.id) return undefined;
    let ignore = false;
    workOrderService.getById(workOrder.id)
      .then((res) => {
        if (!ignore) setRanAWorkDay((res.data?.extensions || []).length > 0);
      })
      // Không lấy được thì cứ hiện nút — backend vẫn chặn bằng 409.
      .catch(() => { /* bỏ qua */ });
    return () => { ignore = true; };
  }, [show, cancellable, workOrder?.id]);

  // Option theo trạng thái + lọc theo vai trò người đang đăng nhập.
  const options = [...(TRANSITIONS[status] || []), ...(cancellable && !ranAWorkDay ? [CANCEL_OPTION] : [])]
    .filter((o) => o.roles.some((r) => userRoles.includes(r)));

  const selectedOption = options.find((o) => o.target === selected);

  const submit = async () => {
    if (!selectedOption) return;
    setSaving(true);
    try {
      // Huỷ phiếu đi CỔNG RIÊNG /cancel, không dùng /status: BE gate /status cho
      // Trưởng ca / Trưởng kíp nên Tổ trưởng gọi vào là 403 ngay ở controller,
      // chưa kịp tới nhánh CANCELLED trong service. Đừng "sửa" bằng cách nới
      // @PreAuthorize của /status — làm vậy là cho Tổ trưởng mở/khoá phiếu ngày
      // luôn, vì các nhánh đó không kiểm role lại ở service.
      if (selectedOption.target === 'CANCELLED') {
        await workOrderService.cancel(workOrder.id);
      } else {
        await workOrderService.updateStatus(workOrder.id, {
          targetStatus: selectedOption.target,
          reason: selectedOption.allowsNote ? (note.trim() || null) : null,
        });
      }
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
            Tài khoản của bạn không có quyền chuyển trạng thái phiếu — chỉ Trưởng ca /
            Trưởng kíp được mở và khoá phiếu ngày. Huỷ phiếu thì phải đúng người
            cấp phiếu, và chỉ khi phiếu chưa chạy ngày công tác nào.
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

            {/* Ghi chú — chỉ khi khoá phiếu ngày, và KHÔNG bắt buộc. */}
            {selectedOption?.allowsNote && (
              <div className="mt-3 p-3 border rounded" style={{ background: 'var(--color-surface-container)' }}>
                <Form.Group>
                  <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                    Ghi chú
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="VD: Khối lượng còn lại nhiều, mai làm tiếp..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Form.Text muted style={{ fontSize: 'var(--text-xs)' }}>
                    Không bắt buộc. Nếu có nhập, ghi chú được in vào bảng công tác
                    hàng ngày trên bản giấy PCT.
                  </Form.Text>
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
