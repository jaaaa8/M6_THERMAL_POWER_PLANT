import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
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
import RepairRequestPage from './pages/RepairRequestPage.jsx';
import WorkOrderList from './components/work_order/WorkOrderList.jsx';
import ListDepartment from './components/hr/department/ListDepartment';
import AddDepartment from './components/hr/department/AddDepartment';
import ListEmployee from './components/hr/employee/ListEmployee';
import AddEmployee from './components/hr/employee/AddEmployee';
import UpdateEmployee from './components/hr/employee/UpdateEmployee';
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
import ListEquipment from './components/equipment/ListEquipment';
import AddEquipment from './components/equipment/AddEquipment';
import UpdateEquipment from './components/equipment/UpdateEquipment';
import DetailEquipment from './components/equipment/DetailEquipment';
import ManageUnits from './components/equipment/ManageUnits';
import MaterialCatalogPage from "./pages/MaterialCatalogPage.jsx";
import ToolList from './pages/ccdc/ToolList.jsx';
import CreateWorkerAccountPage from './pages/ccdc/CreateWorkerAccountPage.jsx';
import ToolLoanManagementPage from './pages/ccdc/ToolLoanManagementPage.jsx';
import ToolCategory from './pages/ccdc/ToolCategory.jsx';
import ToolForm from './pages/ccdc/ToolForm.jsx';
import ToolBorrowRequestForm from './pages/ccdc/ToolBorrowRequestForm.jsx';
import EmployeeLayout from './layouts/EmployeeLayout.jsx';
import EmployeePage from './pages/employee/EmployeePage.jsx';
import EmployeeBorrowForm from './pages/employee/EmployeeBorrowForm.jsx';
import EmployeeBorrowHistory from './pages/employee/EmployeeBorrowHistory.jsx';
import MaterialInventoryPage from "./pages/MaterialInventoryPage.jsx";
import RepairHistoryList from './components/repair_history/RepairHistoryList.jsx';
import MaintenancePlanList from "./components/LubricationPlan/MaintenancePlanList.jsx";
// BÀN THỬ Phase 0 — concept UI, xoá cùng src/concept-a|b|c/ khi chốt xong.
import ConceptA from './concept-a/ConceptA.jsx';
import ConceptB from './concept-b/ConceptB.jsx';
import ConceptC from './concept-c/ConceptC.jsx';

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

            {/* --- Nhân sự (HR_STAFF) --- */}
            <Route element={<ProtectedRoute allowedRoles={['HR_STAFF']}><Outlet /></ProtectedRoute>}>
              <Route path="/hr/departments" element={<ListDepartment />} />
              <Route path="/hr/departments/create" element={<AddDepartment />} />
              <Route path="/hr/employees" element={<ListEmployee />} />
              <Route path="/hr/employees/create" element={<AddEmployee onCancel={() => window.history.back()} />} />
              <Route path="/hr/employees/edit/:id" element={<UpdateEmployee />} />
              <Route path="/hr/accounts" element={<ListAccount />} />
              <Route path="/hr/accounts/create" element={<AddAccount />} />
              <Route path="/hr/employees/detail/:id" element={<PlaceholderPage title="Chi tiết Nhân sự" />} />
            </Route>

            {/* --- Thiết bị (WORKSHOP_FOREMAN) --- */}
            <Route element={<ProtectedRoute allowedRoles={['WORKSHOP_FOREMAN']}><Outlet /></ProtectedRoute>}>
              <Route path="/equipment/system" element={<ListSystem />} />
              <Route path="/equipment/system/add" element={<AddSystem />} />
              <Route path="/equipment/system/edit/:id" element={<EditSystem />} />
              <Route path="/equipment/equipments" element={<ListEquipment />} />
              <Route path="/equipment/equipments/add" element={<AddEquipment />} />
              <Route path="/equipment/equipments/edit/:id" element={<UpdateEquipment />} />
              <Route path="/equipment/equipments/:systemId" element={<ListEquipment />} />
              <Route path="/equipment/equipments/detail/:id" element={<DetailEquipment />} />
              <Route path="/equipment/equipments/units" element={<ManageUnits />} />
            </Route>

            {/* --- Sửa chữa: Yêu cầu Sửa chữa (cả 4 role sửa chữa) --- */}
            <Route element={<ProtectedRoute allowedRoles={['SHIFT_LEADER', 'CREW_LEADER', 'MAINTENANCE_FOREMAN', 'TEAM_LEADER']}><Outlet /></ProtectedRoute>}>
              <Route path="/repair/yeu-cau" element={<RepairRequestPage />} />
            </Route>

            {/* --- Sửa chữa: Phiếu Công tác (vận hành + duyệt) --- */}
            <Route element={<ProtectedRoute allowedRoles={['MAINTENANCE_FOREMAN', 'TEAM_LEADER', 'SHIFT_LEADER', 'CREW_LEADER']}><Outlet /></ProtectedRoute>}>
              <Route path="/repair/phieu-cong-tac" element={<WorkOrderList title="Phiếu Công tác" />} />
            </Route>

            {/* --- Sửa chữa: Đánh giá KT / Xuất vật tư / Lịch sử (MAINTENANCE_FOREMAN, TEAM_LEADER) --- */}
            <Route element={<ProtectedRoute allowedRoles={['MAINTENANCE_FOREMAN', 'TEAM_LEADER']}><Outlet /></ProtectedRoute>}>
              <Route path="/repair/technical-assessment" element={<TechnicalAssessmentList/>} />
              <Route path="/repair/technical-assessment/add" element={<TechnicalAssessmentForm/>} />
              <Route path="/repair/spare-parts-issue" element={<SparePartsIssueList/>} />
              <Route path="/repair/spare-parts-issue/add" element={<SparePartsIssueForm/>} />
              <Route path="/repair/history" element={<RepairHistoryList/>} />
            </Route>

            {/* --- Vật tư (MATERIALS_STOREKEEPER) --- */}
            <Route element={<ProtectedRoute allowedRoles={['MATERIALS_STOREKEEPER']}><Outlet /></ProtectedRoute>}>
              <Route path="/material/catalog" element={<MaterialCatalogPage />} />
              <Route path="/material/import-export/consumable" element={<MaterialInventoryPage key="consumables" type="consumables" />} />
              <Route path="/material/import-export/sparepart" element={<MaterialInventoryPage key="spareparts" type="spareparts" />} />
            </Route>

            {/* --- CCDC (TOOLS_STOREKEEPER) --- */}
            <Route element={<ProtectedRoute allowedRoles={['TOOLS_STOREKEEPER']}><Outlet /></ProtectedRoute>}>
              <Route path="/ccdc/danh-sach" element={<ToolList />} />
              <Route path="/ccdc/danh-sach/them-moi" element={<ToolForm />} />
              <Route path="/ccdc/danh-sach/sua/:id" element={<ToolForm />} />
              <Route path="/ccdc/chung-loai" element={<ToolCategory />} />
              <Route path="/ccdc/muon-tra" element={<ToolLoanManagementPage />} />
              <Route path="/ccdc/muon-tra/lap-phieu" element={<ToolBorrowRequestForm />} />
            </Route>
            {/* Tạo tài khoản công nhân — CCDC lẫn Nhân sự đều được tạo */}
            <Route
              path="/ccdc/tao-nhan-su"
              element={<ProtectedRoute allowedRoles={['TOOLS_STOREKEEPER', 'HR_STAFF']}><CreateWorkerAccountPage /></ProtectedRoute>}
            />

            {/* --- Bảo dưỡng (TEAM_LEADER) --- */}
            <Route element={<ProtectedRoute allowedRoles={['TEAM_LEADER']}><Outlet /></ProtectedRoute>}>
              <Route path="/lubrication/plant" element={<MaintenancePlanList/>} />
              <Route path="/lubrication/plant/add" element={<LubricationPlanForm />} />
              <Route path="/lubrication/checklist" element={<LubricationChecklistPage />} />
              <Route path="/lubrication/history" element={<PlaceholderPage title="Lịch sử Bảo dưỡng" />} />
            </Route>
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

          {/* ======= BÀN THỬ concept UI (Phase 0) — không bọc ProtectedRoute
                     để trình chủ dự án xem không cần đăng nhập.
                     Xoá route này + src/concept-a|b|c/ khi chốt xong concept. ======= */}
          <Route path="/concept-a" element={<ConceptA />} />
          <Route path="/concept-b" element={<ConceptB />} />
          <Route path="/concept-c" element={<ConceptC />} />

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
      background: 'var(--color-surface-bright)',
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
