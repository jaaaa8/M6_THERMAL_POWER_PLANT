import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BsGrid1X2, BsPeople, BsBuilding, BsPersonBadge,
  BsGearWideConnected, BsListUl, BsCpu,
  BsWrenchAdjustable, BsExclamationTriangle, BsFileEarmarkText, BsClipboard2Check,
  BsBoxSeam, BsTags, BsArrowLeftRight,
  BsTools, BsJournalBookmark,
  BsDropletHalf, BsCalendar3, BsClockHistory,
  BsChevronRight, BsShieldLock
} from 'react-icons/bs';
import './Sidebar.css';

/* ============================================================
   Menu Configuration — Cấu hình menu theo Role
   ============================================================ */
const menuSections = [
  {
    heading: 'Tổng quan',
    items: [
      { path: '/', icon: <BsGrid1X2 />, label: 'Dashboard', roles: [] },
    ],
  },
  {
    heading: 'Nhân sự',
    items: [
      {
        icon: <BsPeople />, label: 'Quản lý Nhân sự', roles: ['ADMIN', 'NHAN_SU'],
        children: [
          { path: '/nhan-su/phong-ban', icon: <BsBuilding />, label: 'Phòng ban' },
          { path: '/nhan-su/nhan-vien', icon: <BsPersonBadge />, label: 'Nhân viên' },
          { path: '/nhan-su/tai-khoan', icon: <BsShieldLock />, label: 'Tài khoản & Quyền' },
        ],
      },
    ],
  },
  {
    heading: 'Thiết bị',
    items: [
      {
        icon: <BsGearWideConnected />, label: 'Hệ thống & Thiết bị', roles: ['ADMIN', 'QUAN_DOC_VH', 'KY_THUAT_VIEN'],
        children: [
          { path: '/thiet-bi/he-thong', icon: <BsListUl />, label: 'Hệ thống' },
          { path: '/thiet-bi/danh-sach', icon: <BsCpu />, label: 'Thiết bị' },
        ],
      },
    ],
  },
  {
    heading: 'Sửa chữa',
    items: [
      {
        icon: <BsWrenchAdjustable />, label: 'Sửa chữa', roles: ['ADMIN', 'TRUONG_CA', 'TRUONG_KIP', 'QUAN_DOC_SC', 'TO_TRUONG'],
        children: [
          { path: '/repair/yeu-cau', icon: <BsExclamationTriangle />, label: 'Yêu cầu Sửa chữa' },
          { path: '/repair/phieu-cong-tac', icon: <BsFileEarmarkText />, label: 'Phiếu Công tác' },
          { path: '/repair/danh-gia-kt', icon: <BsClipboard2Check />, label: 'Đánh giá Kỹ thuật' },
        ],
      },
    ],
  },
  {
    heading: 'Kho & Vật tư',
    items: [
      {
        icon: <BsBoxSeam />, label: 'Kho Vật tư', roles: ['ADMIN', 'THU_KHO_VT'],
        children: [
          { path: '/vat-tu/danh-muc', icon: <BsTags />, label: 'Danh mục Vật tư' },
          { path: '/vat-tu/nhap-xuat', icon: <BsArrowLeftRight />, label: 'Nhập / Xuất kho' },
        ],
      },
      {
        icon: <BsTools />, label: 'Công cụ Dụng cụ', roles: ['ADMIN', 'THU_KHO_CCDC'],
        children: [
          { path: '/ccdc/danh-sach', icon: <BsJournalBookmark />, label: 'Danh sách CCDC' },
          { path: '/ccdc/muon-tra', icon: <BsArrowLeftRight />, label: 'Mượn / Trả' },
        ],
      },
    ],
  },
  {
    heading: 'Bảo dưỡng',
    items: [
      {
        icon: <BsDropletHalf />, label: 'Bảo dưỡng Dầu mỡ', roles: ['ADMIN', 'TO_TRUONG'],
        children: [
          { path: '/bao-duong/ke-hoach', icon: <BsCalendar3 />, label: 'Kế hoạch' },
          { path: '/bao-duong/lich-su', icon: <BsClockHistory />, label: 'Lịch sử' },
        ],
      },
    ],
  },
];

/* ============================================================
   Sidebar Component
   ============================================================ */
export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  // TODO: Lấy role từ auth context khi có backend
  const userRole = 'ADMIN';

  const toggleSubmenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSubmenuActive = (children) => {
    return children?.some((child) => location.pathname === child.path);
  };

  const hasAccess = (roles) => {
    if (!roles || roles.length === 0) return true;
    return roles.includes(userRole);
  };

  const sidebarClasses = [
    'sidebar',
    collapsed && 'collapsed',
    mobileOpen && 'mobile-open',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`}
        onClick={onCloseMobile}
      />

      <aside className={sidebarClasses}>
        {/* Brand / Logo */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">⚡</div>
          <div className="sidebar-brand-text">
            <h1>SCMS</h1>
            <span>Nhà máy Nhiệt điện</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => hasAccess(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx}>
                <div className="sidebar-heading">{section.heading}</div>
                {visibleItems.map((item, iIdx) => {
                  const menuKey = `${sIdx}-${iIdx}`;
                  const hasChildren = item.children && item.children.length > 0;
                  const isActive = hasChildren && isSubmenuActive(item.children);
                  const isOpen = openMenus[menuKey] || isActive;

                  if (!hasChildren) {
                    return (
                      <div className="sidebar-item" key={menuKey}>
                        <NavLink
                          to={item.path}
                          end
                          className={({ isActive: navActive }) =>
                            `sidebar-link ${navActive ? 'active' : ''}`
                          }
                          onClick={onCloseMobile}
                        >
                          <span className="sidebar-link-icon">{item.icon}</span>
                          <span className="sidebar-link-text">{item.label}</span>
                        </NavLink>
                      </div>
                    );
                  }

                  return (
                    <div className="sidebar-item" key={menuKey}>
                      <div
                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={() => toggleSubmenu(menuKey)}
                      >
                        <span className="sidebar-link-icon">{item.icon}</span>
                        <span className="sidebar-link-text">{item.label}</span>
                        <BsChevronRight className={`sidebar-link-arrow ${isOpen ? 'open' : ''}`} />
                      </div>
                      <div className={`sidebar-submenu ${isOpen ? 'open' : ''}`}>
                        {item.children.map((child, cIdx) => (
                          <NavLink
                            key={cIdx}
                            to={child.path}
                            className={({ isActive: navActive }) =>
                              `sidebar-link ${navActive ? 'active' : ''}`
                            }
                            onClick={onCloseMobile}
                          >
                            <span className="sidebar-link-icon">{child.icon}</span>
                            <span className="sidebar-link-text">{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer — User info */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-user">
            <div className="sidebar-footer-avatar">AD</div>
            <div className="sidebar-footer-info">
              <div className="name">Admin User</div>
              <div className="role">Quản trị viên</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
