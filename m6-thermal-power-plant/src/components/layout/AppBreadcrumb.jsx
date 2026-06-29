import { Link, useLocation } from 'react-router-dom';
import { BsHouseDoor, BsChevronRight } from 'react-icons/bs';
import './AppBreadcrumb.css';

/* Route slug → Vietnamese label hiển thị */
const routeLabels = {
  // English path slugs (ours)
  admin: 'Quản trị',
  roles: 'Phân quyền',
  hr: 'Nhân sự',
  departments: 'Phòng ban',
  employees: 'Nhân viên',
  new: 'Thêm mới',
  accounts: 'Tài khoản & Quyền',
  create: 'Tạo mới',
  equipment: 'Thiết bị',
  systems: 'Hệ thống',
  repair: 'Sửa chữa',
  requests: 'Yêu cầu Sửa chữa',
  'work-orders': 'Phiếu Công tác',
  assessments: 'Đánh giá Kỹ thuật',
  'spare-parts-issue': 'Phiếu xuất VT thay thế',
  materials: 'Vật tư',
  transactions: 'Nhập / Xuất kho',
  tools: 'Công cụ Dụng cụ',
  borrowings: 'Mượn / Trả',
  maintenance: 'Bảo dưỡng',
  plans: 'Kế hoạch',
  checklist: 'Checklist',
  history: 'Lịch sử',
  // Vietnamese path slugs (main)
  add: 'Thêm mới',
  edit: 'Chỉnh sửa',
  delete: 'Xóa',
  system: 'Hệ thống',
  'nhan-su': 'Nhân sự',
  'phong-ban': 'Phòng ban',
  'nhan-vien': 'Nhân viên',
  'tai-khoan': 'Tài khoản & Quyền',
  'sua-chua': 'Sửa chữa',
  'yeu-cau': 'Yêu cầu Sửa chữa',
  'phieu-cong-tac': 'Phiếu Công tác',
  'danh-gia-kt': 'Đánh giá Kỹ thuật',
  'bao-duong': 'Bảo dưỡng',
  'ke-hoach': 'Kế hoạch',
  'lich-su': 'Lịch sử',
};

export default function AppBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  if (pathnames.length === 0) return null;

  return (
    <nav className="app-breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <BsHouseDoor />
            <span>Trang chủ</span>
          </Link>
        </li>
        {pathnames.map((segment, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = routeLabels[segment] || segment;

          return (
            <li key={segment} className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
              <BsChevronRight className="breadcrumb-separator" />
              {isLast ? (
                <span className="breadcrumb-current">{label}</span>
              ) : (
                <Link to={routeTo} className="breadcrumb-link">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
