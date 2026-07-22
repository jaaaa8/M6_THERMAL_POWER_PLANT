import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { BsPencilSquare, BsXCircle, BsCheckCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { workOrderService } from '../../services/workOrderService';
import { employeeService } from '../../services/hr/employeeService';

/**
 * WorkOrderEditModal — chỉnh sửa MỌI trường của phiếu công tác còn sống, mở
 * trực tiếp từ danh sách PCT (nút "Sửa"). Hiện trường nhà máy thay đổi liên
 * tục nên backend KHÔNG áp ràng buộc lúc tạo (trùng vai trò, chồng lấn giờ);
 * chỉ phiếu COMPLETED/CANCELLED (chứng từ đã chốt) bị từ chối (409).
 *
 * Partial update: trường bỏ trống ("— Giữ nguyên —") gửi null → backend giữ
 * nguyên giá trị cũ (không có cách xoá trắng một vai trò từ form này).
 *
 * @param {boolean} props.show
 * @param {object}  props.workOrder - Dòng WorkOrderDTO từ danh sách (đủ leaderId,
 *                                    directSupervisorId, safetySupervisorId,
 *                                    startTime, repairDescription)
 * @param {Function} props.onClose
 * @param {Function} [props.onChanged] - Gọi sau khi lưu thành công (list refetch)
 */
const toLocalInput = (iso) => (iso ? iso.slice(0, 16) : '');

export default function WorkOrderEditModal({ show, workOrder, onClose, onChanged }) {
  // Parent truyền key={workOrder.id} → mỗi phiếu là một instance mới, form
  // prefill ngay trong useState initializer (không cần effect reset).
  const [form, setForm] = useState(() => (workOrder ? {
    leaderId: workOrder.leaderId ?? '',
    directSupervisorId: workOrder.directSupervisorId ?? '',
    safetySupervisorId: workOrder.safetySupervisorId ?? '',
    startTime: toLocalInput(workOrder.startTime),
    repairDescription: workOrder.repairDescription || '',
  } : null));
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState(null); // null = đang tải

  // Tải danh sách nhân viên khi mở (backend không có endpoint search —
  // tải hết rồi lọc phía client). setState chỉ trong callback async.
  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    employeeService.getAll()
      .then((res) => {
        if (cancelled) return;
        const arr = res.data?.data || res.data || [];
        setEmployees(Array.isArray(arr) ? arr : []);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Không thể tải danh sách nhân viên');
        setEmployees([]);
      });
    return () => { cancelled = true; };
  }, [show]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async () => {
    setSaving(true);
    try {
      await workOrderService.update(workOrder.id, {
        leaderId: form.leaderId ? Number(form.leaderId) : null,
        directSupervisorId: form.directSupervisorId ? Number(form.directSupervisorId) : null,
        safetySupervisorId: form.safetySupervisorId ? Number(form.safetySupervisorId) : null,
        startTime: form.startTime ? `${form.startTime}:00` : null,
        repairDescription: form.repairDescription?.trim() || null,
      });
      toast.success('Đã cập nhật phiếu công tác');
      onClose();
      onChanged?.();
    } catch (err) {
      const data = err.response?.data;
      const msg = (typeof data === 'string' && data.trim()) ? data : (data?.message || err.message);
      toast.error(`Không thể cập nhật: ${msg}`, { autoClose: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !saving && onClose()} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsPencilSquare className="me-2" style={{ color: 'var(--color-primary-500)' }} />
          Chỉnh sửa phiếu — {workOrder?.orderCode}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {form && (
          <>
            <EmployeeSelect
              label="Người lãnh đạo công việc"
              value={form.leaderId}
              onChange={(v) => setField('leaderId', v)}
              employees={employees}
            />
            <EmployeeSelect
              label="Chỉ huy trực tiếp"
              value={form.directSupervisorId}
              onChange={(v) => setField('directSupervisorId', v)}
              employees={employees}
            />
            <EmployeeSelect
              label="Người giám sát an toàn"
              value={form.safetySupervisorId}
              onChange={(v) => setField('safetySupervisorId', v)}
              employees={employees}
            />
            {/* Không sửa giờ kết thúc: end_time là mốc THỰC TẾ, hệ thống đóng
                dấu khi phiếu hoàn thành. */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                Bắt đầu
              </Form.Label>
              <Form.Control
                type="datetime-local"
                size="sm"
                value={form.startTime}
                onChange={(e) => setField('startTime', e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                Mô tả nội dung sửa chữa
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.repairDescription}
                onChange={(e) => setField('repairDescription', e.target.value)}
              />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" disabled={saving} onClick={onClose}>
          <BsXCircle className="me-1" /> Huỷ
        </Button>
        <Button variant="primary" size="sm" disabled={saving} onClick={submit}>
          <BsCheckCircle className="me-1" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/** Select nhân viên — option rỗng = giữ nguyên giá trị hiện tại. */
function EmployeeSelect({ label, value, onChange, employees }) {
  return (
    <Form.Group className="mb-3">
      <Form.Label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
        {label}
      </Form.Label>
      <Form.Select
        size="sm"
        value={value ?? ''}
        disabled={employees === null}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {employees === null ? 'Đang tải danh sách nhân viên...' : '— Giữ nguyên —'}
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
