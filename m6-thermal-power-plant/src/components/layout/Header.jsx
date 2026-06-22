import { useState, useRef, useEffect } from 'react';
import {
  BsList, BsBell, BsMoonStars, BsSun,
  BsPerson, BsKey, BsBoxArrowRight, BsChevronDown
} from 'react-icons/bs';
import './Header.css';

export default function Header({ collapsed, onToggleSidebar, onToggleMobile }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('scms-theme') || 'light';
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        <button className="header-icon-btn" aria-label="Thông báo">
          <BsBell />
          <span className="notification-dot" />
        </button>

        {/* User dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button className="header-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="header-user-avatar">AD</div>
            <div className="header-user-info">
              <div className="name">Admin User</div>
              <div className="role">Quản trị viên</div>
            </div>
            <BsChevronDown className="header-user-arrow" />
          </button>

          {dropdownOpen && (
            <div className="header-dropdown">
              <button className="header-dropdown-item">
                <BsPerson /> Thông tin cá nhân
              </button>
              <button className="header-dropdown-item">
                <BsKey /> Đổi mật khẩu
              </button>
              <div className="header-dropdown-divider" />
              <button className="header-dropdown-item danger">
                <BsBoxArrowRight /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
