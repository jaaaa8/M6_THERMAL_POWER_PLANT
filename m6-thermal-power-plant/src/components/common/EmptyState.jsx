import { BsInboxes } from 'react-icons/bs';
import './EmptyState.css';

/**
 * EmptyState — Hiển thị khi không có dữ liệu.
 * 
 * @param {string} [props.title='Chưa có dữ liệu']
 * @param {string} [props.message]
 * @param {React.ReactNode} [props.icon] - Icon tuỳ chỉnh
 * @param {React.ReactNode} [props.action] - Nút hành động
 */
export default function EmptyState({
  title = 'Chưa có dữ liệu',
  message = 'Không tìm thấy kết quả nào phù hợp.',
  icon,
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <BsInboxes />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
