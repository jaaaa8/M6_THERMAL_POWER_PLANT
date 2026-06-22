import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — Bảo vệ route theo authentication & role.
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Component con cần bảo vệ
 * @param {string[]} [props.allowedRoles] - Danh sách roles được phép truy cập
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  // TODO: Thay bằng auth context thực khi có backend
  const isAuthenticated = true;
  const userRole = 'ADMIN';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
