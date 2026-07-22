import { Link, useLocation } from 'react-router-dom';
import { BsHouseDoor, BsChevronRight } from 'react-icons/bs';
import './AppBreadcrumb.css';

/* Route label mapping */
const routeLabels = {
  admin: 'Quản trị',
  roles: 'Phân quyền',
  hr: 'Nhân sự',
  departments: 'Phòng ban',
  employees: 'Nhân viên',
  new: 'Thêm mới',
  accounts: 'Tài khoản & Quyền',
  equipment: 'Hệ thống & Thiết bị ',
  equipments: 'Danh sách thiết bị',
  units: 'Đơn vị đo lường',
  systems: 'Hệ thống',
  system: 'Hệ thống',
  parameter: 'Quản lý thông số',
  repair: 'Sửa chữa',
  requests: 'Yêu cầu Sửa chữa',
  'work-orders': 'Phiếu Công tác',
  assessments: 'Đánh giá Kỹ thuật',
  materials: 'Vật tư',
  transactions: 'Nhập / Xuất kho',
  tools: 'Công cụ Dụng cụ',
  borrowings: 'Mượn / Trả',
  maintenance: 'Bảo dưỡng',
  plans: 'Kế hoạch',
  history: 'Lịch sử',
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
                <Link
                  to={segment === 'equipment' ? '/equipment/system' : routeTo}
                  className="breadcrumb-link"
                >
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
