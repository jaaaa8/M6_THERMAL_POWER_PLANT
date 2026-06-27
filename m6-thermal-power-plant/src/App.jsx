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
import RepairRequest from './pages/RepairRequest.jsx';
import ListDepartment from './components/hr/department/ListDepartment';
import AddDepartment from './components/hr/department/AddDepartment';
import ListEmployee from './components/hr/employee/ListEmployee';
import AddEmployee from './components/hr/employee/AddEmployee';
import ListAccount from './components/hr/account/ListAccount';
import AddAccount from './components/hr/account/AddAccount';
import TechnicalAssessmentForm from "./components/technical_assessment/AddComponent.jsx";
import SparePartsIssueForm from "./components/spare_parts_issue/SparePartsIssueForm.jsx";
import LubricationChecklistPage from "./components/LubricationChecklistPage/LubricationChecklistPage.jsx";
import LubricationPlanForm from "./components/LubricationPlan/LubricationPlanForm.jsx";
import ListSystem from './components/equipment/ListSystem';
import AddSystem from './components/equipment/AddSystem';
import EditSystem from './components/equipment/EditSystem';

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

            {/* --- Nhân sự --- */}
            <Route path="/nhan-su/phong-ban" element={<ListDepartment />} />
            <Route path="/nhan-su/phong-ban/them-moi" element={<AddDepartment />} />
            <Route path="/nhan-su/nhan-vien" element={<ListEmployee />} />
            <Route path="/nhan-su/them-moi" element={<AddEmployee onCancel={() => window.history.back()} />} />
            <Route path="/nhan-su/tai-khoan" element={<ListAccount />} />
            <Route path="/nhan-su/tai-khoan/them-moi" element={<AddAccount />} />
            <Route path="/nhan-su/thong-tin-chi-tiet/:id" element={<PlaceholderPage title="Chi tiết Nhân sự" />} />

            {/* --- Thiết bị --- */}
            <Route path="/equipment/system" element={<ListSystem />} />
            <Route path="/equipment/system/add" element={<AddSystem />} />
            <Route path="/equipment/system/edit/:id" element={<EditSystem />} />
            <Route path="/equipment/listsystem" element={<PlaceholderPage title="Danh sách Thiết bị" />} />

            {/* --- Sửa chữa --- */}
            <Route path="/sua-chua/yeu-cau" element={<RepairRequest />} />
            <Route path="/sua-chua/phieu-cong-tac" element={<PlaceholderPage title="Phiếu Công tác" />} />
            <Route path="/repair/danh-gia-kt" element={<TechnicalAssessmentForm />} />
            <Route path="/sua-chua/phieu-xuat-vtthaythe" element={<SparePartsIssueForm />} />

            {/* --- Vật tư --- */}
            <Route path="/vat-tu/danh-muc" element={<PlaceholderPage title="Danh mục Vật tư" />} />
            <Route path="/vat-tu/nhap-xuat" element={<PlaceholderPage title="Nhập / Xuất kho" />} />

            {/* --- CCDC --- */}
            <Route path="/ccdc/danh-sach" element={<PlaceholderPage title="Danh sách CCDC" />} />
            <Route path="/ccdc/muon-tra" element={<PlaceholderPage title="Mượn / Trả CCDC" />} />

            {/* --- Bảo dưỡng --- */}
            <Route path="/bao-duong/ke-hoach" element={<PlaceholderPage title="Kế hoạch Bảo dưỡng" />} />
            <Route path="/bao-duong/ke-hoach/them-moi" element={<LubricationPlanForm />} />
            <Route path="/bao-duong/ke-hoach/list" element={<LubricationChecklistPage />} />
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
