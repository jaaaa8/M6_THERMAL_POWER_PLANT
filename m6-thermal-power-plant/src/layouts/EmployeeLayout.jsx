import { Outlet, useNavigate } from 'react-router-dom';
import { BsBoxArrowRight, BsTools } from 'react-icons/bs';
import { authService } from '../services/authService';
import NotificationBell from '../components/common/NotificationBell';
import './EmployeeLayout.css';

export default function EmployeeLayout() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="emp-layout">
            <header className="emp-header">
                <div className="emp-header-brand">
                    <BsTools className="emp-header-icon" />
                    <span>Cổng nhân viên</span>
                </div>
                <div className="emp-header-right">
                    <span className="emp-header-name">{user?.fullName || user?.username}</span>
                    <NotificationBell accountId={user?.accountId} />
                    <button className="emp-logout-btn" onClick={handleLogout} title="Đăng xuất">
                        <BsBoxArrowRight />
                    </button>
                </div>
            </header>
            <main className="emp-main">
                <Outlet />
            </main>
        </div>
    );
}
