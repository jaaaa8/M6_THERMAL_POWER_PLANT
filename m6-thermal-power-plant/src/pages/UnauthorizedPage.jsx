import { Link } from 'react-router-dom';
import { BsShieldExclamation } from 'react-icons/bs';

export default function UnauthorizedPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <BsShieldExclamation style={{
        fontSize: '4rem',
        color: 'var(--color-status-warning)',
        marginBottom: '1.5rem',
        opacity: 0.7,
      }} />
      <h1 style={{
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
      }}>
        Không có quyền truy cập
      </h1>
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-tertiary)',
        maxWidth: '400px',
        marginBottom: '1.5rem',
      }}>
        Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
      </p>
      <Link to="/" className="btn btn-primary btn-sm">
        Về trang chủ
      </Link>
    </div>
  );
}
