import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { tokenStore } from '../../services/apiClient';
import { canAccess } from '../../services/roleService';

/**
 * ProtectedRoute — Bảo vệ route theo authentication & phân quyền.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Component con cần bảo vệ
 * @param {string[]} [props.allowedRoles] - Danh sách roles được phép (kiểm tra cứng)
 * @param {string} [props.requireFunction] - Mã chức năng cần quyền XEM (theo ma trận phân quyền)
 */
export default function ProtectedRoute({ children, allowedRoles, requireFunction }) {
  const [bootstrapped, setBootstrapped] = useState(() => !!authService.getCurrentUser());
  const hasToken = !!tokenStore.getAccess();

  // F5 case: có accessToken nhưng mất user trong storage → gọi /me khôi phục.
  useEffect(() => {
    if (!bootstrapped && hasToken) {
      let cancelled = false;
      authService
        .fetchMe()
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setBootstrapped(true);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [bootstrapped, hasToken]);

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (!bootstrapped) {
    return null; // chờ /me trả về
  }

  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  const userRole = currentUser?.role;

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireFunction && !canAccess(userRole, requireFunction)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
