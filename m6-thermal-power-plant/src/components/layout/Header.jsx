import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BsList, BsMoonStars, BsSun,
  BsPerson, BsKey, BsBoxArrowRight, BsChevronDown
} from 'react-icons/bs';
import { authService } from '../../services/authService';
import { SYSTEM_ROLES } from '../../services/roleService';
import ProfileDetail from '../profile/ProfileDetail';
import ChangePasswordModal from '../profile/ChangePasswordModal';
import NotificationBell from '../common/NotificationBell';
import './Header.css';

export default function Header({ collapsed, onToggleSidebar, onToggleMobile }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('scms-theme') || 'light';
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const dropdownRef = useRef(null);

  // User hiện tại
  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.fullName || 'Người dùng';
  const roleLabel = SYSTEM_ROLES.find((r) => r.roleCode === currentUser?.role)?.roleName || 'Người dùng';
  const userInitials = userName.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Đã đăng xuất');
    navigate('/login', { replace: true });
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('scms-theme', theme);
  }, [theme]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleToggle = () => {
    // On mobile: open sidebar drawer; On desktop: collapse sidebar
    if (window.innerWidth < 992) {
      onToggleMobile?.();
    } else {
      onToggleSidebar?.();
    }
  };

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left */}
      <div className="header-left">
        <button className="header-toggle" onClick={handleToggle} aria-label="Toggle menu">
          <BsList />
        </button>
        <span className="header-title">Hệ thống SCMS</span>
      </div>

      {/* Right */}
      <div className="header-right">
        {/* Theme toggle */}
        <button className="header-icon-btn" onClick={toggleTheme} aria-label="Đổi giao diện">
          {theme === 'light' ? <BsMoonStars /> : <BsSun />}
        </button>

        {/* Notifications */}
        <NotificationBell accountId={currentUser?.accountId} />

        {/* User dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button className="header-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="header-user-avatar">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl.startsWith('http') ? currentUser.avatarUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${currentUser.avatarUrl}`}
                  alt={userName}
                  className="w-100 h-100 rounded-circle object-fit-cover"
                />
              ) : (
                userInitials || 'U'
              )}
            </div>
            <div className="header-user-info">
              <div className="name">{userName}</div>
              <div className="role">{roleLabel}</div>
            </div>
            <BsChevronDown className="header-user-arrow" />
          </button>

          {dropdownOpen && (
            <div className="header-dropdown">
              <button
                className="header-dropdown-item"
                onClick={() => { setProfileOpen(true); setDropdownOpen(false); }}
              >
                <BsPerson /> Thông tin cá nhân
              </button>
              <button
                className="header-dropdown-item"
                onClick={() => { setChangePasswordOpen(true); setDropdownOpen(false); }}
              >
                <BsKey /> Đổi mật khẩu
              </button>
              <div className="header-dropdown-divider" />
              <button className="header-dropdown-item danger" onClick={handleLogout}>
                <BsBoxArrowRight /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      <ProfileDetail
        show={profileOpen}
        onClose={() => setProfileOpen(false)}
        onChangePasswordClick={() => setChangePasswordOpen(true)}
      />

      <ChangePasswordModal
        show={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </header>
  );
}
