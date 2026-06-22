import { Component } from 'react';
import { BsExclamationOctagon } from 'react-icons/bs';

/**
 * ErrorBoundary — Bắt lỗi React không crash toàn app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <BsExclamationOctagon style={{
            fontSize: '3rem',
            color: 'var(--color-status-danger)',
            marginBottom: '1rem',
            opacity: 0.7,
          }} />
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}>
            Đã xảy ra lỗi
          </h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            maxWidth: '400px',
            marginBottom: '1.5rem',
          }}>
            Hệ thống gặp sự cố không mong muốn. Vui lòng tải lại trang hoặc liên hệ quản trị viên.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
