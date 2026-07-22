import { useState, useEffect, useCallback } from 'react';
import { Form, Button, Spinner, Nav, Badge } from 'react-bootstrap';
import { BsShieldCheck, BsSave, BsArrowClockwise } from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import ConfirmModal from '../components/common/ConfirmModal';
import { roleService, SYSTEM_ROLES } from '../services/roleService';
import './RoleManagementPage.css';

/**
 * Nhóm permission theo prefix của code (khớp bộ 44 permission backend seed).
 * Permission mới không khớp prefix nào sẽ rơi vào nhóm "Khác".
 */
const PERMISSION_GROUPS = [
  { name: 'Nhân sự & Phân quyền', prefixes: ['DEPARTMENT_', 'EMPLOYEE_', 'ACCOUNT_', 'PERMISSION_'] },
  { name: 'Hệ thống & Thiết bị', prefixes: ['EQUIPMENT_'] },
  { name: 'Vật tư & Kho', prefixes: ['CONSUMABLE_', 'SPARE_PART_', 'INVENTORY_'] },
  { name: 'Công cụ Dụng cụ', prefixes: ['TOOL_'] },
  { name: 'Sửa chữa & Phiếu công tác', prefixes: ['REPAIR_REQUEST_', 'WORK_ORDER_'] },
  { name: 'Đánh giá kỹ thuật', prefixes: ['TECHNICAL_ASSESSMENT_', 'REPAIR_HISTORY_'] },
  { name: 'Bảo dưỡng định kỳ', prefixes: ['LUBRICATION_'] },
];

function groupPermissions(permissions) {
  const grouped = PERMISSION_GROUPS.map((g) => ({ name: g.name, items: [] }));
  const other = { name: 'Khác', items: [] };
  permissions.forEach((p) => {
    const group = PERMISSION_GROUPS.findIndex((g) =>
      g.prefixes.some((prefix) => p.code.startsWith(prefix))
    );
    if (group >= 0) grouped[group].items.push(p);
    else other.items.push(p);
  });
  if (other.items.length > 0) grouped.push(other);
  return grouped.filter((g) => g.items.length > 0);
}

/** Label VN cho role — fallback về chính code nếu role mới chưa khai báo trong SYSTEM_ROLES. */
function roleLabel(roleName) {
  return SYSTEM_ROLES.find((r) => r.roleCode === roleName)?.roleName || roleName;
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [originalIds, setOriginalIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  // true sẵn — role đầu tiên được auto-chọn ngay sau khi load xong danh sách
  const [loadingRole, setLoadingRole] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);

  // Load danh sách role + toàn bộ permission (1 lần).
  // Không setState đồng bộ trước await (rule react-hooks/set-state-in-effect) —
  // loading=true đã là state khởi tạo; nút "Thử lại" tự bật lại trước khi gọi.
  const loadInitial = useCallback(async () => {
    try {
      const [roleList, permissionList] = await Promise.all([
        roleService.getRoles(),
        roleService.getAllPermissions(),
      ]);
      setRoles(roleList);
      setAllPermissions(permissionList);
      if (roleList.length > 0) setSelectedRoleId(roleList[0].id);
    } catch {
      setError('Không thể tải dữ liệu phân quyền');
      toast.error('Lỗi tải dữ liệu phân quyền');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Data-fetching chuẩn: mọi setState trong loadInitial đều nằm SAU await,
    // rule set-state-in-effect flag nhầm (conservative) → disable có chủ đích.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitial();
  }, [loadInitial]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadInitial();
  };

  // Load permission của role đang chọn
  useEffect(() => {
    if (selectedRoleId == null) return;
    let cancelled = false;
    (async () => {
      try {
        const rolePerms = await roleService.getRolePermissions(selectedRoleId);
        if (cancelled) return;
        const ids = new Set(rolePerms.map((p) => p.id));
        setCheckedIds(ids);
        setOriginalIds(new Set(ids));
      } catch {
        if (!cancelled) toast.error('Lỗi tải quyền của vai trò');
      } finally {
        if (!cancelled) setLoadingRole(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRoleId]);

  const handleToggle = (permissionId) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  // Toggle cả nhóm: nếu đã tick hết → bỏ hết, ngược lại tick hết
  const handleToggleGroup = (items) => {
    const allChecked = items.every((p) => checkedIds.has(p.id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      items.forEach((p) => {
        if (allChecked) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  };

  const hasChanges =
    checkedIds.size !== originalIds.size ||
    [...checkedIds].some((id) => !originalIds.has(id));

  const countChanges = () => {
    let count = 0;
    checkedIds.forEach((id) => {
      if (!originalIds.has(id)) count++;
    });
    originalIds.forEach((id) => {
      if (!checkedIds.has(id)) count++;
    });
    return count;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await roleService.updateRolePermissions(selectedRoleId, [...checkedIds]);
      setOriginalIds(new Set(checkedIds));
      setShowConfirm(false);
      toast.success('Cập nhật phân quyền thành công! Người dùng thuộc vai trò này sẽ nhận quyền mới ở lần thao tác kế tiếp.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật phân quyền');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCheckedIds(new Set(originalIds));
    toast.info('Đã hoàn tác tất cả thay đổi');
  };

  // Đổi role đang chọn — cảnh báo nếu còn thay đổi chưa lưu
  const handleSelectRole = (roleId) => {
    if (roleId === selectedRoleId) return;
    if (hasChanges && !window.confirm('Có thay đổi chưa lưu, chuyển vai trò sẽ mất các thay đổi này?')) {
      return;
    }
    setLoadingRole(true); // bật spinner từ event handler (tránh setState sync trong effect)
    setSelectedRoleId(roleId);
  };

  const groupedPermissions = groupPermissions(allPermissions);

  if (loading) {
    return (
      <div>
        <PageHeader title="Phân quyền hệ thống" subtitle="Đang tải..." icon={<BsShieldCheck />} />
        <div className="role-loading">
          <Spinner animation="border" variant="primary" />
          <p>Đang tải dữ liệu phân quyền...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Phân quyền hệ thống" icon={<BsShieldCheck />} />
        <div className="role-error">
          <p className="text-danger">{error}</p>
          <Button variant="outline-primary" size="sm" onClick={handleRetry}>
            <BsArrowClockwise className="me-1" /> Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Phân quyền hệ thống"
        subtitle={`${roles.length} vai trò · ${allPermissions.length} quyền`}
        icon={<BsShieldCheck />}
        actions={
          <div className="role-header-actions">
            {hasChanges && (
              <span className="role-changes-badge">{countChanges()} thay đổi</span>
            )}
            <Button variant="outline-secondary" size="sm" onClick={handleReset} disabled={!hasChanges}>
              <BsArrowClockwise className="me-1" /> Hoàn tác
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowConfirm(true)} disabled={!hasChanges}>
              <BsSave className="me-1" /> Lưu thay đổi
            </Button>
          </div>
        }
      />

      {/* Chọn vai trò */}
      <div className="role-matrix-wrapper surface-card role-permission-panel">
        <Nav variant="pills" className="role-pills">
          {roles.map((role) => (
            <Nav.Item key={role.id}>
              <Nav.Link
                active={role.id === selectedRoleId}
                onClick={() => handleSelectRole(role.id)}
              >
                {roleLabel(role.name)}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        {/* Danh sách permission nhóm theo domain */}
        {loadingRole ? (
          <div className="role-loading">
            <Spinner animation="border" size="sm" variant="primary" />
            <p>Đang tải quyền của vai trò...</p>
          </div>
        ) : (
          <div className="role-permission-groups">
            {groupedPermissions.map((group) => {
              const checkedInGroup = group.items.filter((p) => checkedIds.has(p.id)).length;
              const allChecked = checkedInGroup === group.items.length;
              return (
                <div key={group.name} className="role-permission-group">
                  <div className="role-permission-group-header">
                    <Form.Check
                      type="checkbox"
                      id={`group-${group.name}`}
                      checked={allChecked}
                      onChange={() => handleToggleGroup(group.items)}
                      label={<strong>{group.name}</strong>}
                    />
                    <Badge bg={checkedInGroup > 0 ? 'primary' : 'secondary'} pill>
                      {checkedInGroup}/{group.items.length}
                    </Badge>
                  </div>
                  <div className="role-permission-group-body">
                    {group.items.map((p) => {
                      const isChanged = checkedIds.has(p.id) !== originalIds.has(p.id);
                      return (
                        <div key={p.id} className={`role-permission-item ${isChanged ? 'cell-changed' : ''}`}>
                          <Form.Check
                            type="checkbox"
                            id={`perm-${p.id}`}
                            checked={checkedIds.has(p.id)}
                            onChange={() => handleToggle(p.id)}
                            label={
                              <span>
                                {p.description || p.code}{' '}
                                <code className="role-permission-code">{p.code}</code>
                              </span>
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="Lưu phân quyền"
        message={`Bạn có chắc chắn muốn lưu ${countChanges()} thay đổi cho vai trò "${roleLabel(roles.find((r) => r.id === selectedRoleId)?.name)}"? Người dùng thuộc vai trò này sẽ phải làm mới phiên để nhận quyền mới.`}
        confirmText="Lưu thay đổi"
        variant="primary"
        loading={saving}
      />
    </div>
  );
}
