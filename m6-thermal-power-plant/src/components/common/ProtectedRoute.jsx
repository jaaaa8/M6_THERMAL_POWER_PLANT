import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { tokenStore } from '../../services/apiClient';
import { hasAnyRole } from '../../services/roleService';

/**
 * ProtectedRoute — Bảo vệ route theo authentication & phân quyền theo ROLE.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Component con cần bảo vệ
 * @param {string[]} [props.allowedRoles] - Danh sách role được phép (ADMIN luôn qua — xem roleService.hasAnyRole).
 *                                          Bỏ trống = chỉ cần đăng nhập.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
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

  // Chặn thật sự nằm ở backend (@PreAuthorize) — đây là lớp UX, tránh việc
  // gõ tay URL vẫn vào được trang rồi mới nhận lỗi 403 từ API.
  if (!hasAnyRole(currentUser, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
