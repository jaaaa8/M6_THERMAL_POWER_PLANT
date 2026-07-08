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
import RepairRequest from './components/repair_request/RepairRequest.jsx';
import WorkOrderList from './components/work_order/WorkOrderList.jsx';
import ListDepartment from './components/hr/department/ListDepartment';
import AddDepartment from './components/hr/department/AddDepartment';
import ListEmployee from './components/hr/employee/ListEmployee';
import AddEmployee from './components/hr/employee/AddEmployee';
import ListAccount from './components/hr/account/ListAccount';
import AddAccount from './components/hr/account/AddAccount';
import TechnicalAssessmentList from "./components/technical_assessment/TechnicalAssessmentList.jsx";
import TechnicalAssessmentForm from "./components/technical_assessment/AddComponent.jsx";
import SparePartsIssueList from "./components/spare_parts_issue/SparePartsIssueList.jsx";
import SparePartsIssueForm from "./components/spare_parts_issue/SparePartsIssueForm.jsx";
import LubricationChecklistPage from "./components/LubricationChecklistPage/LubricationChecklistPage.jsx";
import LubricationPlanForm from "./components/LubricationPlan/LubricationPlanForm.jsx";
import ListSystem from './components/equipment/ListSystem';
import AddSystem from './components/equipment/AddSystem';
import EditSystem from './components/equipment/EditSystem';
import MaterialCatalogPage from "./pages/MaterialCatalogPage.jsx";
import RoleManagementPage from "./pages/RoleManagementPage.jsx";
import CreateAccountPage from "./pages/CreateAccountPage.jsx";
import ToolList from './pages/ccdc/ToolList.jsx';
import CreateWorkerAccountPage from './pages/ccdc/CreateWorkerAccountPage.jsx';
import ToolLoanManagementPage from './pages/ccdc/ToolLoanManagementPage.jsx';
import ToolCategory from './pages/ccdc/ToolCategory .jsx';
import ToolForm from './pages/ccdc/ToolForm.jsx';
import ToolBorrowRequestForm from './pages/ccdc/ToolBorrowRequestForm.jsx';
import EmployeeLayout from './layouts/EmployeeLayout.jsx';
import EmployeePage from './pages/employee/EmployeePage.jsx';
import EmployeeBorrowForm from './pages/employee/EmployeeBorrowForm.jsx';
import EmployeeBorrowHistory from './pages/employee/EmployeeBorrowHistory.jsx';

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
            {/* --- Nhân sự --- */}
            <Route path="/hr/departments" element={<ListDepartment />} />
            <Route path="/hr/departments/create" element={<AddDepartment />} />
            <Route path="/hr/employees" element={<ListEmployee />} />
            <Route path="/hr/employees/create" element={<AddEmployee onCancel={() => window.history.back()} />} />
            <Route path="/hr/accounts" element={<ListAccount />} />
            <Route path="/hr/accounts/create" element={<AddAccount />} />
            <Route path="/hr/employees/detail/:id" element={<PlaceholderPage title="Chi tiết Nhân sự" />} />

            {/* --- Thiết bị --- */}
            <Route path="/equipment/system" element={<ListSystem />} />
            <Route path="/equipment/system/add" element={<AddSystem />} />
            <Route path="/equipment/system/edit/:id" element={<EditSystem />} />
            <Route path="/equipment/listsystem" element={<PlaceholderPage title="Danh sách Thiết bị" />} />

            {/* --- Sửa chữa --- */}
            <Route path="/repair/yeu-cau" element={<RepairRequest />} />
            <Route path="/repair/phieu-cong-tac" element={<WorkOrderList title="Phiếu Công tác" />} />
            <Route path="/repair/technical-assessment" element={<TechnicalAssessmentList/>} />
            <Route path="/repair/technical-assessment/add" element={<TechnicalAssessmentForm/>} />
            <Route path="/repair/spare-parts-issue" element={<SparePartsIssueList/>} />
            <Route path="/repair/spare-parts-issue/add" element={<SparePartsIssueForm/>} />

            {/* --- Vật tư --- */}
            <Route path="/material/catalog" element={<MaterialCatalogPage/>} />
            <Route path="/vat-tu/nhap-xuat" element={<PlaceholderPage title="Nhập / Xuất kho" />} />

            {/* --- CCDC --- */}
            <Route path="/ccdc/danh-sach" element={<ToolList />} />
            <Route path="/ccdc/danh-sach/them-moi" element={<ToolForm />} />
            <Route path="/ccdc/danh-sach/sua/:id" element={<ToolForm />} />
            <Route path="/ccdc/chung-loai" element={<ToolCategory />} />
            <Route path="/ccdc/muon-tra" element={<ToolLoanManagementPage />} />
            <Route path="/ccdc/muon-tra/lap-phieu" element={<ToolBorrowRequestForm />} />
            <Route path="/ccdc/tao-nhan-su" element={<CreateWorkerAccountPage />} />

            {/* --- Bảo dưỡng --- */}
            <Route path="/bao-duong/ke-hoach" element={<PlaceholderPage title="Kế hoạch Bảo dưỡng" />} />
            <Route path="/bao-duong/ke-hoach/them-moi" element={<LubricationPlanForm />} />
            <Route path="/bao-duong/ke-hoach/list" element={<LubricationChecklistPage />} />
            <Route path="/bao-duong/lich-su" element={<PlaceholderPage title="Lịch sử Bảo dưỡng" />} />
          </Route>

          {/* ======= Employee Portal ======= */}
          <Route element={
            <ProtectedRoute>
              <EmployeeLayout />
            </ProtectedRoute>
          }>
            <Route path="/employee" element={<EmployeePage />} />
            <Route path="/employee/muon-ccdc" element={<EmployeeBorrowForm />} />
            <Route path="/employee/lich-su" element={<EmployeeBorrowHistory />} />
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
