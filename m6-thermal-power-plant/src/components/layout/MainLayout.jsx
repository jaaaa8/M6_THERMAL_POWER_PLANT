import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import AppBreadcrumb from './AppBreadcrumb';
import './MainLayout.css';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`main-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="main-wrapper">
        <Header
          collapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onToggleMobile={toggleMobile}
        />

        <main className="main-content">
          <AppBreadcrumb />
          <div className="main-content-inner animate-fade-in">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
