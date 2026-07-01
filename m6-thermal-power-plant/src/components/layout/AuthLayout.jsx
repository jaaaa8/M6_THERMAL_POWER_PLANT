import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      {/* Animated background grid */}
      <div className="auth-bg-pattern" />

      <div className="auth-container">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">⚡</div>
          <h1 className="auth-brand-title">SCMS</h1>
          <p className="auth-brand-subtitle">
            Hệ thống Quản lý Sửa chữa & Bảo dưỡng<br />
            Nhà máy Nhiệt điện
          </p>
        </div>

        {/* Auth form card */}
        <div className="auth-card">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="auth-footer">
          © {new Date().getFullYear()} SCMS — Phiên bản <span className="font-mono">v1.0.0</span>
        </p>
      </div>
    </div>
  );
}
