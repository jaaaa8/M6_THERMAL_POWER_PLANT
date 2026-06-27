import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import NhanSuForm from './components/hr/EmployeeForm';
import RoleManagementPage from './pages/RoleManagementPage';
import CreateAccountPage from './pages/CreateAccountPage';
import RepairRequestPage from './pages/RepairRequestPage';
import WorkOrderPage from './pages/WorkOrderPage';
import WorkOrderListPage from './pages/WorkOrderListPage';

function App() {
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
            <Route path="/admin/roles" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RoleManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/accounts/create" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CreateAccountPage />
              </ProtectedRoute>
            } />

            {/* --- HR --- */}
            <Route path="/hr/departments" element={
              <ProtectedRoute requireFunction="DEPARTMENT"><PlaceholderPage title="Quản lý Phòng ban" /></ProtectedRoute>
            } />
            <Route path="/hr/employees" element={
              <ProtectedRoute requireFunction="EMPLOYEE"><PlaceholderPage title="Quản lý Nhân viên" /></ProtectedRoute>
            } />
            <Route path="/hr/employees/new" element={
              <ProtectedRoute requireFunction="EMPLOYEE"><NhanSuForm onCancel={() => window.history.back()} /></ProtectedRoute>
            } />
            <Route path="/hr/accounts" element={
              <ProtectedRoute requireFunction="ACCOUNT"><PlaceholderPage title="Tài khoản & Phân quyền" /></ProtectedRoute>
            } />

            {/* --- Equipment --- */}
            <Route path="/equipment/systems" element={
              <ProtectedRoute requireFunction="EQUIPMENT_SYSTEM"><PlaceholderPage title="Danh sách Hệ thống" /></ProtectedRoute>
            } />
            <Route path="/equipment" element={
              <ProtectedRoute requireFunction="EQUIPMENT"><PlaceholderPage title="Danh sách Thiết bị" /></ProtectedRoute>
            } />

            {/* --- Repair --- */}
            <Route path="/repair/requests" element={
              <ProtectedRoute requireFunction="REPAIR_REQUEST"><RepairRequestPage /></ProtectedRoute>
            } />
            <Route path="/repair/work-orders" element={
              <ProtectedRoute requireFunction="WORK_ORDER"><WorkOrderListPage /></ProtectedRoute>
            } />
            <Route path="/repair/work-orders/:id" element={
              <ProtectedRoute requireFunction="WORK_ORDER"><WorkOrderPage /></ProtectedRoute>
            } />
            <Route path="/repair/assessments" element={
              <ProtectedRoute requireFunction="TECHNICAL_ASSESSMENT"><PlaceholderPage title="Đánh giá Kỹ thuật" /></ProtectedRoute>
            } />

            {/* --- Materials --- */}
            <Route path="/materials" element={
              <ProtectedRoute requireFunction="MATERIAL"><PlaceholderPage title="Danh mục Vật tư" /></ProtectedRoute>
            } />
            <Route path="/materials/transactions" element={
              <ProtectedRoute requireFunction="MATERIAL"><PlaceholderPage title="Nhập / Xuất kho" /></ProtectedRoute>
            } />

            {/* --- Tools (CCDC) --- */}
            <Route path="/tools" element={
              <ProtectedRoute requireFunction="TOOL"><PlaceholderPage title="Danh sách CCDC" /></ProtectedRoute>
            } />
            <Route path="/tools/borrowings" element={
              <ProtectedRoute requireFunction="TOOL"><PlaceholderPage title="Mượn / Trả CCDC" /></ProtectedRoute>
            } />

            {/* --- Maintenance --- */}
            <Route path="/maintenance/plans" element={
              <ProtectedRoute requireFunction="MAINTENANCE"><PlaceholderPage title="Kế hoạch Bảo dưỡng" /></ProtectedRoute>
            } />
            <Route path="/maintenance/history" element={
              <ProtectedRoute requireFunction="MAINTENANCE"><PlaceholderPage title="Lịch sử Bảo dưỡng" /></ProtectedRoute>
            } />
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
    <div>
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
