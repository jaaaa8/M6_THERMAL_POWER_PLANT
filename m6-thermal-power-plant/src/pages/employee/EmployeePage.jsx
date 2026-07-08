import { useNavigate } from 'react-router-dom';
import { BsTools, BsClipboardPlus } from 'react-icons/bs';
import { authService } from '../../services/authService';
import './EmployeePage.css';

export default function EmployeePage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    return (
        <div className="emp-home">
            <div className="emp-welcome">
                <h1>Xin chào, <span>{user?.fullName || user?.username}</span> 👋</h1>
                <p>Chọn chức năng bên dưới để tiếp tục</p>
            </div>

            <div className="emp-cards">
                <button className="emp-card" onClick={() => navigate('/employee/muon-ccdc')}>
                    <div className="emp-card-icon">
                        <BsClipboardPlus />
                    </div>
                    <div className="emp-card-text">
                        <span className="emp-card-title">Mượn công cụ</span>
                        <span className="emp-card-desc">Tạo yêu cầu mượn CCDC từ kho</span>
                    </div>
                </button>

                <button className="emp-card secondary" onClick={() => navigate('/employee/lich-su')}>
                    <div className="emp-card-icon">
                        <BsTools />
                    </div>
                    <div className="emp-card-text">
                        <span className="emp-card-title">Lịch sử mượn</span>
                        <span className="emp-card-desc">Xem các phiếu mượn đã tạo</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
