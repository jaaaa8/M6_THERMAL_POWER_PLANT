import './LoadingSpinner.css';

/**
 * LoadingSpinner — Hiệu ứng loading.
 * @param {object} props
 * @param {string} [props.text='Đang tải...'] - Text hiển thị
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Kích thước
 * @param {boolean} [props.fullPage=false] - Chiếm toàn trang
 */
export default function LoadingSpinner({ text = 'Đang tải...', size = 'md', fullPage = false }) {
  return (
    <div className={`loading-spinner ${fullPage ? 'full-page' : ''} size-${size}`}>
      <div className="spinner-ring">
        <div /><div /><div /><div />
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}
