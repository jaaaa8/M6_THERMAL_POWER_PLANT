import { BsHeart } from 'react-icons/bs';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span>© {year} <strong>SCMS</strong> — Hệ thống Quản lý Sửa chữa & Bảo dưỡng Nhà máy Nhiệt điện</span>
      </div>
      <div className="footer-right">
        <span className="footer-version">v1.0.1</span>
      </div>
    </footer>
  );
}
