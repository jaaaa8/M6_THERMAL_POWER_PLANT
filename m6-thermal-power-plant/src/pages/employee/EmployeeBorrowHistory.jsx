import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    BsClockHistory, BsArrowLeft, BsTools, BsCalendar,
    BsCheckCircle, BsXCircle, BsHourglass, BsArrowCounterclockwise,
} from 'react-icons/bs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toolBorrowLogService } from '../../services/toolService';
import { authService } from '../../services/authService';

const STATUS_CONFIG = {
    PENDING:  { label: 'Chờ duyệt',  bg: 'warning',   text: 'dark', icon: <BsHourglass /> },
    APPROVED: { label: 'Đã duyệt',   bg: 'success',   text: 'white', icon: <BsCheckCircle /> },
    REJECTED: { label: 'Bị từ chối', bg: 'danger',    text: 'white', icon: <BsXCircle /> },
    RETURNED: { label: 'Đã trả',     bg: 'secondary', text: 'white', icon: <BsArrowCounterclockwise /> },
};

function fmtDate(iso) {
    if (!iso) return '—';
    return iso.slice(0, 10).split('-').reverse().join('/');
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, bg: 'light', text: 'dark', icon: null };
    return (
        <Badge bg={cfg.bg} text={cfg.text} className="d-inline-flex align-items-center gap-1 px-2 py-1">
            {cfg.icon} {cfg.label}
        </Badge>
    );
}

export default function EmployeeBorrowHistory() {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (!currentUser?.accountId) return;
        toolBorrowLogService.search({ accountId: currentUser.accountId, size: 100 })
            .then((res) => {
                const page = res.data?.data;
                setLogs(page?.content ?? page ?? []);
            })
            .catch(() => toast.error('Không thể tải lịch sử mượn'))
            .finally(() => setLoading(false));
    }, [currentUser?.accountId]);

    if (loading) return <LoadingSpinner text="Đang tải lịch sử..." fullPage />;

    return (
        <div className="animate-fade-in" style={{ padding: '8px 0' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <BsClockHistory style={{ fontSize: '1.4rem', color: 'var(--color-primary-500)' }} />
                    <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                        Lịch sử mượn CCDC
                    </h2>
                </div>
                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                    Tất cả yêu cầu mượn công cụ của bạn
                </p>
            </div>

            {logs.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 0',
                    background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-color)',
                }}>
                    <BsClockHistory style={{ fontSize: '3rem', color: 'var(--text-quaternary)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>Bạn chưa có phiếu mượn nào.</p>
                    <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/employee/muon-ccdc')}>
                        Tạo yêu cầu mượn
                    </Button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {logs.map((log) => (
                        <div key={log.id} style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-xl)',
                            padding: '16px 20px',
                            display: 'flex', alignItems: 'center', gap: 16,
                            boxShadow: 'var(--shadow-sm)',
                        }}>
                            {/* Icon */}
                            <div style={{
                                width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '1.1rem', flexShrink: 0,
                            }}>
                                <BsTools />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 2 }}>
                                    {log.toolName || log.tool?.name || '—'}
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <span><BsCalendar className="me-1" />Mượn: {fmtDate(log.borrowDate)}</span>
                                    <span>Hạn trả: {fmtDate(log.dueDate)}</span>
                                    {log.returnDate && <span>Đã trả: {fmtDate(log.returnDate)}</span>}
                                    {log.quantity && <span>SL: {log.quantity}</span>}
                                </div>
                                {log.borrowPurpose && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                                        Mục đích: {log.borrowPurpose}
                                    </div>
                                )}
                                {log.rejectionReason && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-status-error)', marginTop: 4 }}>
                                        Lý do từ chối: {log.rejectionReason}
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div style={{ flexShrink: 0 }}>
                                <StatusBadge status={log.status} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4">
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/employee')}>
                    <BsArrowLeft className="me-1" /> Về trang chủ
                </Button>
            </div>
        </div>
    );
}
