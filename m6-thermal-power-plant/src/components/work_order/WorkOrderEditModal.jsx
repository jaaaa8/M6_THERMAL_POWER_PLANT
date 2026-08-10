import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { BsPencilSquare, BsXCircle, BsCheckCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { workOrderService } from '../../services/workOrderService';
import { employeeService } from '../../services/hr/employeeService';
import SearchSelectField from '../common/SearchSelectField';

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

/** Mã role (roles.name trong DB) được phép làm Người giám sát an toàn. */
const SAFETY_SUPERVISOR_ROLE = 'SAFETY_SUPERVISOR';

/* ============================================================
   Helpers search nhân viên server-side (chung cho mọi SearchSelectField).
   ============================================================ */
const EMP_KEY = (e) => e.id;
const EMP_LABEL = (e) => `${e.fullName || e.name || 'Unknown'} · ${e.position?.name || e.positionName || ''}`;
const EMP_RENDER = (e) => (
  <>
    <strong>{e.fullName || e.name || 'Unknown'}</strong>
    <span className="ssf-item-sub">
      {[e.employeeCode, e.position?.name || e.positionName, e.department?.name].filter(Boolean).join(' · ')}
    </span>
  </>
);
const searchEmployees = (p) => employeeService.search({
  keyword: p.query || undefined,
  page: p.page,
  size: p.size,
});

export default function WorkOrderEditModal({ show, workOrder, onClose, onChanged }) {
  // Parent truyền key={workOrder.id} → mỗi phiếu là một instance mới, form
  // prefill ngay trong useState initializer (không cần effect reset).
  const [form, setForm] = useState(() => (workOrder ? {
    leaderId: workOrder.leaderId ?? '',
    directSupervisorId: workOrder.directSupervisorId ?? '',
    safetySupervisorId: workOrder.safetySupervisorId ?? '',
    leaderLabel: workOrder.leaderName || '',
    directSupervisorLabel: workOrder.directSupervisorName || '',
    safetySupervisorLabel: workOrder.safetySupervisorName || '',
    startTime: toLocalInput(workOrder.startTime),
    repairDescription: workOrder.repairDescription || '',
  } : null));
  const [saving, setSaving] = useState(false);
  // Nhân viên bận ở phiếu sống KHÁC (loại trừ chính phiếu đang sửa để 3 người
  // đang giữ vai trò vẫn chọn được). null = đang tải.
  const [busyIds, setBusyIds] = useState(null);

  // Tải danh sách bận khi mở — setState chỉ trong callback async.
  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    workOrderService.getBusyEmployees(workOrder.id)
      .then((busyRes) => {
        if (cancelled) return;
        setBusyIds(Array.isArray(busyRes.data) ? busyRes.data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setBusyIds([]);
      });
    return () => { cancelled = true; };
  }, [show, workOrder?.id]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Quy tắc lọc từng ô (giống 2 modal tạo):
  // - CẢ 3 vai trò chỉ hiện nhân viên RẢNH ở phiếu sống KHÁC (busyIds đã loại
  //   chính phiếu đang sửa — người đang giữ vai trò vẫn chọn được).
  // - LĐ / Chỉ huy trực tiếp ĐƯỢC là CÙNG một người, chỉ không trùng GSAT.
  // - GSAT thêm điều kiện: khác LĐ/chỉ huy + CHỈ hiện người có role
  //   SAFETY_SUPERVISOR (roles lấy từ kết quả search — account.roles).
  const roleFilter = (field) => (list) => list.filter((e) => {
    if (busyIds && busyIds.includes(e.id)) return false;
    if (field === 'safetySupervisorId') {
      if (Number(form.leaderId) === e.id || Number(form.directSupervisorId) === e.id) return false;
      const roles = (e.account?.roles || []).map((r) => r?.name || r);
      if (!roles.includes(SAFETY_SUPERVISOR_ROLE)) return false;
    } else if (Number(form.safetySupervisorId) === e.id) {
      return false;
    }
    return true;
  });

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
          <BsPencilSquare className="me-2" style={{ color: 'var(--color-primary)' }} />
          Chỉnh sửa phiếu — {workOrder?.orderCode}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {form && (
          <>
            <SearchSelectField
              label="Người lãnh đạo công việc"
              mode="single"
              emptyLabel="— Giữ nguyên —"
              searchFn={searchEmployees}
              getKey={EMP_KEY}
              renderItem={EMP_RENDER}
              placeholder="Tìm theo tên, mã NV, phòng ban..."
              value={form.leaderId || null}
              onChange={(item) => {
                setField('leaderId', item ? item.id : '');
                setField('leaderLabel', item ? EMP_LABEL(item) : '');
              }}
              selectedLabel={form.leaderLabel}
              excludedIds={form.safetySupervisorId ? [Number(form.safetySupervisorId)] : []}
              filterClient={roleFilter('leaderId')}
            />
            <SearchSelectField
              label="Chỉ huy trực tiếp"
              mode="single"
              emptyLabel="— Giữ nguyên —"
              searchFn={searchEmployees}
              getKey={EMP_KEY}
              renderItem={EMP_RENDER}
              placeholder="Tìm theo tên, mã NV, phòng ban..."
              value={form.directSupervisorId || null}
              onChange={(item) => {
                setField('directSupervisorId', item ? item.id : '');
                setField('directSupervisorLabel', item ? EMP_LABEL(item) : '');
              }}
              selectedLabel={form.directSupervisorLabel}
              excludedIds={form.safetySupervisorId ? [Number(form.safetySupervisorId)] : []}
              filterClient={roleFilter('directSupervisorId')}
            />
            <SearchSelectField
              label="Người giám sát an toàn"
              mode="single"
              emptyLabel="— Giữ nguyên —"
              searchFn={searchEmployees}
              getKey={EMP_KEY}
              renderItem={EMP_RENDER}
              placeholder="Tìm theo tên, mã NV, phòng ban..."
              value={form.safetySupervisorId || null}
              onChange={(item) => {
                setField('safetySupervisorId', item ? item.id : '');
                setField('safetySupervisorLabel', item ? EMP_LABEL(item) : '');
              }}
              selectedLabel={form.safetySupervisorLabel}
              excludedIds={[form.leaderId, form.directSupervisorId].map(Number).filter(Boolean)}
              filterClient={roleFilter('safetySupervisorId')}
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
