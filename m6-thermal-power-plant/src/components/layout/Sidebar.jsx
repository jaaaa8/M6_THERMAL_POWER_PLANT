import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BsGrid1X2, BsPeople, BsBuilding, BsPersonBadge, BsPersonPlus,
  BsGearWideConnected, BsListUl, BsCpu,
  BsWrenchAdjustable, BsExclamationTriangle, BsFileEarmarkText, BsClipboard2Check,
  BsBoxSeam, BsTags, BsArrowLeftRight,
  BsTools, BsJournalBookmark,
  BsDropletHalf, BsCalendar3, BsClockHistory,
  BsChevronRight, BsShieldLock
} from 'react-icons/bs';
import { authService } from '../../services/authService';
import { canAccess, SYSTEM_ROLES } from '../../services/roleService';
import './Sidebar.css';

/* ============================================================
   Menu Configuration — Lọc theo ma trận phân quyền (func = mã chức năng).
   - func: cần quyền XEM chức năng tương ứng (theo roleService).
   - roles: kiểm tra cứng theo vai trò (cho mục không nằm trong ma trận).
   - không có cả hai: ai cũng thấy.
   ============================================================ */
const menuSections = [
  {
    heading: 'Tổng quan',
    items: [
      { path: '/', icon: <BsGrid1X2 />, label: 'Bảng điều khiển' },
    ],
  },
  {
    heading: 'Nhân sự',
    items: [
      {
        icon: <BsPeople />, label: 'Quản lý Nhân sự',
        children: [
          { path: '/hr/departments', icon: <BsBuilding />, label: 'Phòng ban', func: 'DEPARTMENT' },
          { path: '/hr/employees', icon: <BsPersonBadge />, label: 'Nhân viên', func: 'EMPLOYEE' },
          { path: '/hr/accounts', icon: <BsShieldLock />, label: 'Tài khoản & Quyền', func: 'ACCOUNT' },
        ],
      },
    ],
  },
  {
    heading: 'Thiết bị',
    items: [
      {
        icon: <BsGearWideConnected />, label: 'Hệ thống & Thiết bị',
        children: [
          { path: '/equipment/systems', icon: <BsListUl />, label: 'Hệ thống', func: 'EQUIPMENT_SYSTEM' },
          { path: '/equipment', icon: <BsCpu />, label: 'Thiết bị', func: 'EQUIPMENT' },
        ],
      },
    ],
  },
  {
    heading: 'Sửa chữa',
    items: [
      {
        icon: <BsWrenchAdjustable />, label: 'Sửa chữa',
        children: [
          { path: '/repair/requests', icon: <BsExclamationTriangle />, label: 'Yêu cầu Sửa chữa', func: 'REPAIR_REQUEST' },
          { path: '/repair/work-orders', icon: <BsFileEarmarkText />, label: 'Phiếu Công tác', func: 'WORK_ORDER' },
          { path: '/repair/assessments', icon: <BsClipboard2Check />, label: 'Đánh giá Kỹ thuật', func: 'TECHNICAL_ASSESSMENT' },
          { path: '/repair/spare-parts-issue', icon: <BsClipboard2Check />, label: 'Phiếu xuất VT thay thế', func: 'TECHNICAL_ASSESSMENT' },
        ],
      },
    ],
  },
  {
    heading: 'Kho & Vật tư',
    items: [
      {
        icon: <BsBoxSeam />, label: 'Kho Vật tư',
        children: [
          { path: '/materials', icon: <BsTags />, label: 'Danh mục Vật tư', func: 'MATERIAL' },
          { path: '/materials/transactions', icon: <BsArrowLeftRight />, label: 'Nhập / Xuất kho', func: 'MATERIAL' },
        ],
      },
      {
        icon: <BsTools />, label: 'Công cụ Dụng cụ',
        children: [
          { path: '/tools', icon: <BsJournalBookmark />, label: 'Danh sách CCDC', func: 'TOOL' },
          { path: '/tools/borrowings', icon: <BsArrowLeftRight />, label: 'Mượn / Trả', func: 'TOOL' },
        ],
      },
    ],
  },
  {
    heading: 'Bảo dưỡng',
    items: [
      {
        icon: <BsDropletHalf />, label: 'Bảo dưỡng Dầu mỡ',
        children: [
          { path: '/maintenance/plans', icon: <BsCalendar3 />, label: 'Kế hoạch', func: 'MAINTENANCE' },
          { path: '/maintenance/history', icon: <BsClockHistory />, label: 'Lịch sử', func: 'MAINTENANCE' },
        ],
      },
    ],
  },
  {
    heading: 'Quản trị',
    items: [
      { path: '/admin/roles', icon: <BsShieldLock />, label: 'Phân quyền', roles: ['ADMIN'] },
      { path: '/admin/accounts/create', icon: <BsPersonPlus />, label: 'Tạo tài khoản', roles: ['ADMIN'] },
    ],
  },
];

/* ============================================================
   Sidebar Component
   ============================================================ */
export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  // Lấy user/role thật từ authService
  const currentUser = authService.getCurrentUser();
  const userRole = currentUser?.role;
  const roleLabel = SYSTEM_ROLES.find((r) => r.roleCode === userRole)?.roleName || 'Người dùng';
  const userName = currentUser?.fullName || 'Người dùng';
  const userInitials = userName.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

  const toggleSubmenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Khi click vào child item (NavLink) → đóng tất cả dropdown khác, chỉ giữ dropdown chứa item đó
  const closeOtherMenus = (currentMenuKey) => {
    setOpenMenus((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        next[k] = k === currentMenuKey ? prev[k] : false;
      });
      return next;
    });
  };

  const isSubmenuActive = (children) => {
    return children?.some((child) => location.pathname === child.path);
  };

  // Quyền xem một mục (item hoặc child)
  const canSee = (node) => {
    if (node.roles && node.roles.length > 0) return node.roles.includes(userRole);
    if (node.func) return canAccess(userRole, node.func);
    return true;
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
            // Lọc các item: item có children → còn ≥1 child xem được; item đơn → canSee
            const visibleItems = section.items
              .map((item) => {
                if (item.children) {
                  const visibleChildren = item.children.filter(canSee);
                  return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
                }
                return canSee(item) ? item : null;
              })
              .filter(Boolean);

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
                            onClick={() => {
                              closeOtherMenus(menuKey);
                              onCloseMobile?.();
                            }}
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
            <div className="sidebar-footer-avatar">{userInitials || 'U'}</div>
            <div className="sidebar-footer-info">
              <div className="name">{userName}</div>
              <div className="role">{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
