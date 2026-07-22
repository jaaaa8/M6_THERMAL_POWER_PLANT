import { Outlet } from 'react-router-dom';
import { BsLightningChargeFill } from 'react-icons/bs';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      {/* Left Side: Visual / Branding with thermal plant image */}
      <div className="auth-branding-panel">
        {/* Background image */}
        <img src="/thermal-plant.jpg" alt="Nhà máy nhiệt điện" className="auth-branding-img" />
        <div className="auth-branding-overlay"></div>
        
        <div className="auth-branding-content">
          <div>
            <div className="auth-branding-logo">
              <BsLightningChargeFill />
              <h1 className="text-headline-lg" style={{ color: '#fff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>SCMS</h1>
            </div>
            <h2 className="text-headline-md" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '400px' }}>
              Hệ thống Quản lý Thiết bị & Bảo trì
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontSize: 'var(--text-body-sm)' }}>
              Nhà máy Nhiệt điện
            </p>
          </div>

          {/* Decorative Status Widget */}
          <div className="auth-status-widget">
            <div className="auth-status-widget-header">
              <span className="text-label-sm" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái hệ thống</span>
              <span className="auth-status-dot"></span>
            </div>
            <div className="auth-status-widget-grid">
              <div>
                <span className="text-headline-sm" style={{ color: 'var(--color-text-primary)', display: 'block' }}>Trực tuyến</span>
                <span className="text-label-sm" style={{ color: 'var(--color-text-secondary)' }}>Tình trạng máy chủ</span>
              </div>
              <div>
                <span className="text-headline-sm font-mono" style={{ color: 'var(--color-text-primary)', display: 'block' }}>99.9%</span>
                <span className="text-label-sm" style={{ color: 'var(--color-text-secondary)' }}>Độ tin cậy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          {/* Mobile Branding */}
          <div className="auth-mobile-brand">
            <BsLightningChargeFill style={{ fontSize: '2rem', color: 'var(--color-primary)' }} />
            <h1 className="text-headline-lg" style={{ color: 'var(--color-primary)', textTransform: 'uppercase' }}>SCMS</h1>
            <p className="text-body-sm" style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '4px' }}>
              Hệ thống Quản lý Thiết bị & Bảo trì
            </p>
          </div>

          <div className="auth-form-header">
            <h2 className="text-headline-lg" style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Đăng nhập vào hệ thống</h2>
            <p className="text-body-md" style={{ color: 'var(--color-text-secondary)' }}>Vui lòng nhập thông tin xác thực để tiếp tục.</p>
          </div>

          {/* Auth form card - renders LoginPage via Outlet */}
          <div className="auth-card">
            <Outlet />
          </div>

          {/* Footer */}
          <p className="auth-footer">
            © {new Date().getFullYear()} SCMS — Phiên bản <span className="font-mono">v1.0.0</span>
          </p>
        </div>
      </div>
    </div>
  );
}
