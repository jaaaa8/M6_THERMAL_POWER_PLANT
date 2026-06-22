import './StatusBadge.css';

/**
 * StatusBadge — Badge trạng thái theo chuẩn công nghiệp.
 * 
 * @param {'normal'|'warning'|'danger'|'inactive'|'info'} props.status
 * @param {string} [props.label] - Text hiển thị (tự động nếu không truyền)
 * @param {boolean} [props.pulse=false] - Hiệu ứng nhấp nháy cho trạng thái khẩn cấp
 */

const statusConfig = {
  normal: { label: 'Đang vận hành', dotClass: 'dot-normal' },
  warning: { label: 'Cảnh báo', dotClass: 'dot-warning' },
  danger: { label: 'Sự cố', dotClass: 'dot-danger' },
  inactive: { label: 'Ngừng hoạt động', dotClass: 'dot-inactive' },
  info: { label: 'Đang sửa chữa', dotClass: 'dot-info' },
};

export default function StatusBadge({ status = 'inactive', label, pulse = false }) {
  const config = statusConfig[status] || statusConfig.inactive;
  const displayLabel = label || config.label;

  return (
    <span className={`status-badge status-${status}`}>
      <span className={`status-dot ${config.dotClass} ${pulse ? 'pulse' : ''}`} />
      {displayLabel}
    </span>
  );
}
