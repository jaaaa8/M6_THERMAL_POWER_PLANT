import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// AOS — Animate On Scroll
import AOS from 'aos';
import 'aos/dist/aos.css';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NhanSuForm from './components/nhansu/NhanSuForm';
import RoleManagementPage from './pages/RoleManagementPage';
import RepairRequestPage from './pages/RepairRequestPage';
import WorkOrderPage from './pages/WorkOrderPage';
import WorkOrderListPage from './pages/WorkOrderListPage';

function App() {
  // Khởi tạo AOS
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      offset: 50,
      delay: 0,
    });
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ======= Auth Layout (Login) ======= */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* ======= Main Layout (Authenticated) ======= */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* --- Admin --- */}
            <Route path="/admin/phan-quyen" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RoleManagementPage />
              </ProtectedRoute>
            } />

            {/* --- Nhân sự --- */}
            <Route path="/nhan-su/phong-ban" element={<PlaceholderPage title="Quản lý Phòng ban" />} />
            <Route path="/nhan-su/nhan-vien" element={<PlaceholderPage title="Quản lý Nhân viên" />} />
            <Route path="/nhan-su/them-moi" element={<NhanSuForm onCancel={() => window.history.back()} />} />
            <Route path="/nhan-su/tai-khoan" element={<PlaceholderPage title="Tài khoản & Phân quyền" />} />

            {/* --- Thiết bị --- */}
            <Route path="/thiet-bi/he-thong" element={<PlaceholderPage title="Danh sách Hệ thống" />} />
            <Route path="/thiet-bi/danh-sach" element={<PlaceholderPage title="Danh sách Thiết bị" />} />

            {/* --- Sửa chữa --- */}
            <Route path="/sua-chua/yeu-cau" element={<RepairRequestPage />} />
            <Route path="/sua-chua/phieu-cong-tac" element={<WorkOrderListPage />} />
            <Route path="/sua-chua/phieu-cong-tac/:id" element={<WorkOrderPage />} />
            <Route path="/sua-chua/danh-gia-kt" element={<PlaceholderPage title="Đánh giá Kỹ thuật" />} />

            {/* --- Vật tư --- */}
            <Route path="/vat-tu/danh-muc" element={<PlaceholderPage title="Danh mục Vật tư" />} />
            <Route path="/vat-tu/nhap-xuat" element={<PlaceholderPage title="Nhập / Xuất kho" />} />

            {/* --- CCDC --- */}
            <Route path="/ccdc/danh-sach" element={<PlaceholderPage title="Danh sách CCDC" />} />
            <Route path="/ccdc/muon-tra" element={<PlaceholderPage title="Mượn / Trả CCDC" />} />

            {/* --- Bảo dưỡng --- */}
            <Route path="/bao-duong/ke-hoach" element={<PlaceholderPage title="Kế hoạch Bảo dưỡng" />} />
            <Route path="/bao-duong/lich-su" element={<PlaceholderPage title="Lịch sử Bảo dưỡng" />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

/* --- Placeholder page cho các module chưa triển khai --- */
function PlaceholderPage({ title }) {
  return (
    <div className="animate-fade-in">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          opacity: 0.3,
        }}>🚧</div>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}>{title}</h1>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
        }}>
          Trang này đang được phát triển bởi các thành viên trong nhóm.
        </p>
      </div>
    </div>
  );
}

/* --- 404 Page --- */
function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      background: 'var(--bg-body)',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'var(--font-bold)', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
        404
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Trang bạn tìm không tồn tại.
      </p>
      <a href="/" className="btn btn-primary btn-sm">Về trang chủ</a>
    </div>
  );
}

export default App;
