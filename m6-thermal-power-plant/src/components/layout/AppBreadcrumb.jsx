import { Link, useLocation } from 'react-router-dom';
import { BsHouseDoor, BsChevronRight } from 'react-icons/bs';
import './AppBreadcrumb.css';

/* Route label mapping */
const routeLabels = {
  'nhan-su': 'Nhân sự',
  'phong-ban': 'Phòng ban',
  'nhan-vien': 'Nhân viên',
  'tai-khoan': 'Tài khoản & Quyền',
  'thiet-bi': 'Thiết bị',
  'he-thong': 'Hệ thống',
  'danh-sach': 'Danh sách',
  'sua-chua': 'Sửa chữa',
  'yeu-cau': 'Yêu cầu Sửa chữa',
  'phieu-cong-tac': 'Phiếu Công tác',
  'danh-gia-kt': 'Đánh giá Kỹ thuật',
  'vat-tu': 'Vật tư',
  'danh-muc': 'Danh mục',
  'nhap-xuat': 'Nhập / Xuất kho',
  'ccdc': 'Công cụ Dụng cụ',
  'muon-tra': 'Mượn / Trả',
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
