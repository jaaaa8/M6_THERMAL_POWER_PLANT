import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
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
  const currentUser = authService.getCurrentUser();
  const isAuthenticated = !!currentUser;
  const userRole = currentUser?.role;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireFunction && !canAccess(userRole, requireFunction)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
