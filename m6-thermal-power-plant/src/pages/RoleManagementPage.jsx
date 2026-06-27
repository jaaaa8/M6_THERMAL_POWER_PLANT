import { useState, useEffect } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { BsShieldCheck, BsSave, BsArrowClockwise } from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import ConfirmModal from '../components/common/ConfirmModal';
import { roleService, PERMISSION_LABELS } from '../services/roleService';
import './RoleManagementPage.css';

export default function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [actions, setActions] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await roleService.getRolePermissions();
      const { roles: r, functions: f, actions: a, permissions: p } = res.data;
      setRoles(r);
      setFunctions(f);
      setActions(a);
      setPermissions(p);
      setOriginalPermissions(p);
    } catch (err) {
      setError('Không thể tải dữ liệu phân quyền');
      toast.error('Lỗi tải dữ liệu phân quyền');
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu phân quyền
  useEffect(() => {
    loadPermissions();
  }, []);

  // Toggle checkbox
  const handleToggle = (roleCode, funcCode, action) => {
    const key = `${roleCode}_${funcCode}_${action}`;
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle cả hàng (chức năng) cho 1 role
  const handleToggleRow = (roleCode, funcCode) => {
    const allChecked = actions.every(
      (a) => permissions[`${roleCode}_${funcCode}_${a}`]
    );
    const newPerms = { ...permissions };
    actions.forEach((a) => {
      newPerms[`${roleCode}_${funcCode}_${a}`] = !allChecked;
    });
    setPermissions(newPerms);
  };

  // Kiểm tra có thay đổi gì không
  const hasChanges = JSON.stringify(permissions) !== JSON.stringify(originalPermissions);

  // Đếm số thay đổi
  const countChanges = () => {
    let count = 0;
    Object.keys(permissions).forEach((key) => {
      if (permissions[key] !== originalPermissions[key]) count++;
    });
    return count;
  };

  // Lưu thay đổi
  const handleSave = async () => {
    try {
      setSaving(true);
      await roleService.updatePermissions(permissions);
      setOriginalPermissions({ ...permissions });
      setShowConfirm(false);
      toast.success('Cập nhật phân quyền thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật phân quyền');
    } finally {
      setSaving(false);
    }
  };

  // Reset về ban đầu
  const handleReset = () => {
    setPermissions({ ...originalPermissions });
    toast.info('Đã hoàn tác tất cả thay đổi');
  };

  // Nhóm chức năng theo nhóm
  const groupedFunctions = functions.reduce((acc, func) => {
    if (!acc[func.groupName]) acc[func.groupName] = [];
    acc[func.groupName].push(func);
    return acc;
  }, {});

  // Loading state
  if (loading) {
    return (
      <div>
        <PageHeader
          title="Phân quyền hệ thống"
          subtitle="Đang tải..."
          icon={<BsShieldCheck />}
        />
        <div className="role-loading">
          <Spinner animation="border" variant="primary" />
          <p>Đang tải dữ liệu phân quyền...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <PageHeader title="Phân quyền hệ thống" icon={<BsShieldCheck />} />
        <div className="role-error">
          <p className="text-danger">{error}</p>
          <Button variant="outline-primary" size="sm" onClick={loadPermissions}>
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
        subtitle={`${roles.length} vai trò · ${functions.length} chức năng`}
        icon={<BsShieldCheck />}
        actions={
          <div className="role-header-actions">
            {hasChanges && (
              <span className="role-changes-badge">
                {countChanges()} thay đổi
              </span>
            )}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <BsArrowClockwise className="me-1" /> Hoàn tác
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={!hasChanges}
            >
              <BsSave className="me-1" /> Lưu thay đổi
            </Button>
          </div>
        }
      />

      {/* Permission Matrix */}
      <div className="role-matrix-wrapper surface-card">
        <div className="role-matrix-scroll">
          <table className="role-matrix-table">
            <thead>
              <tr>
                <th className="role-matrix-func-header" rowSpan={2}>
                  Chức năng
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="role-matrix-role-header"
                    colSpan={actions.length}
                  >
                    {role.roleName}
                  </th>
                ))}
              </tr>
              <tr>
                {roles.map((role) =>
                  actions.map((action) => (
                    <th key={`${role.id}_${action}`} className="role-matrix-action-header">
                      {PERMISSION_LABELS[action]}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedFunctions).map(([groupName, funcs]) => (
                <>
                  <tr key={`group-${groupName}`} className="role-matrix-group-row">
                    <td colSpan={1 + roles.length * actions.length}>
                      {groupName}
                    </td>
                  </tr>
                  {funcs.map((func) => (
                    <tr key={func.id} className="role-matrix-data-row">
                      <td className="role-matrix-func-cell">
                        {func.featureName}
                      </td>
                      {roles.map((role) =>
                        actions.map((action) => {
                          const key = `${role.roleCode}_${func.featureCode}_${action}`;
                          const isChecked = !!permissions[key];
                          const isChanged = permissions[key] !== originalPermissions[key];
                          return (
                            <td
                              key={key}
                              className={`role-matrix-checkbox-cell ${isChanged ? 'cell-changed' : ''}`}
                            >
                              <Form.Check
                                type="checkbox"
                                id={key}
                                checked={isChecked}
                                onChange={() => handleToggle(role.roleCode, func.featureCode, action)}
                                className="role-checkbox"
                              />
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="Lưu phân quyền"
        message={`Bạn có chắc chắn muốn lưu ${countChanges()} thay đổi phân quyền? Hành động này sẽ ảnh hưởng đến quyền truy cập của các vai trò trong hệ thống.`}
        confirmText="Lưu thay đổi"
        variant="primary"
        loading={saving}
      />
    </div>
  );
}
