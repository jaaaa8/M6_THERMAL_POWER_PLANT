import './PageHeader.css';

/**
 * PageHeader — Tiêu đề trang nhất quán.
 * 
 * @param {string} props.title - Tiêu đề chính
 * @param {string} [props.subtitle] - Mô tả phụ
 * @param {React.ReactNode} [props.actions] - Nút hành động (góc phải)
 * @param {React.ReactNode} [props.icon] - Icon trước tiêu đề
 */
export default function PageHeader({ title, subtitle, actions, icon }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {icon && <span className="page-header-icon">{icon}</span>}
        <div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
