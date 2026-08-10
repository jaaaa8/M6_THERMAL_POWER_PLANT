import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsBell, BsBellFill, BsCheckAll } from 'react-icons/bs';
import { notificationService } from '../../services/notificationService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { speak } from '../../utils/speak';
import './NotificationBell.css';

const REPAIR_LOGIN_ANNOUNCE_KEY = 'scms_announce_repair_after_login';

function isUnreadRepairRequestNotification(notif) {
    return notif?.isRead === false
        && notif.title === 'Yêu cầu sửa chữa mới'
        && notif.link === '/repair/yeu-cau';
}

function announceRepairRequest(notif, lastSpokenIdRef) {
    if (!isUnreadRepairRequestNotification(notif)) return;
    if (lastSpokenIdRef.current === notif.id) return;

    lastSpokenIdRef.current = notif.id;
    speak('Có thông báo sửa chữa mới');
}

function timeAgo(createdAt) {
    const diff = (Date.now() - new Date(createdAt).getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function NotificationBell({ accountId }) {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const lastSpokenIdRef = useRef(null);

    const unread = notifications.filter((n) => !n.isRead).length;

    useEffect(() => {
        if (!accountId) return;

        let welcomeAfterLogin = null;
        try {
            welcomeAfterLogin = sessionStorage.getItem(REPAIR_LOGIN_ANNOUNCE_KEY);
            if (welcomeAfterLogin !== null) {
                sessionStorage.removeItem(REPAIR_LOGIN_ANNOUNCE_KEY);
            }
        } catch {
            // Không có sessionStorage thì chuông vẫn hoạt động bình thường.
        }

        const load = async () => {
            try {
                const res = await notificationService.getByAccount(accountId);
                const loaded = res.data?.data ?? [];
                setNotifications(loaded);

                if (welcomeAfterLogin !== null && lastSpokenIdRef.current === null) {
                    const repairNotification = loaded.find(isUnreadRepairRequestNotification);
                    if (repairNotification) {
                        announceRepairRequest(repairNotification, lastSpokenIdRef);
                    } else {
                        speak(welcomeAfterLogin);
                    }
                }
            } catch {
                if (welcomeAfterLogin !== null && lastSpokenIdRef.current === null) {
                    speak(welcomeAfterLogin);
                }
            }
        };

        load();
    }, [accountId]);

    // Nhận thông báo real-time
    useWebSocket(accountId, (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        announceRepairRequest(notif, lastSpokenIdRef);
    });

    // Đóng dropdown khi click ngoài
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleClick = async (notif) => {
        if (!notif.isRead) {
            await notificationService.markRead(notif.id, accountId);
            setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
        }
        setOpen(false);
        if (notif.link) navigate(notif.link);
    };

    const handleMarkAll = async () => {
        await notificationService.markAllRead(accountId);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    return (
        <div className="notif-bell-wrap" ref={ref}>
            <button className="notif-bell-btn" onClick={() => setOpen((o) => !o)} title="Thông báo">
                {unread > 0 ? <BsBellFill className="notif-bell-icon ringing" /> : <BsBell className="notif-bell-icon" />}
                {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
            </button>

            {open && (
                <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                        <span>Thông báo {unread > 0 && <span className="notif-count-label">({unread} chưa đọc)</span>}</span>
                        {unread > 0 && (
                            <button className="notif-mark-all" onClick={handleMarkAll} title="Đánh dấu tất cả đã đọc">
                                <BsCheckAll /> Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="notif-list">
                        {notifications.length === 0 && (
                            <div className="notif-empty">Chưa có thông báo nào</div>
                        )}
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                                onClick={() => handleClick(n)}
                            >
                                {!n.isRead && <span className="notif-dot" />}
                                <div className="notif-item-content">
                                    <div className="notif-item-title">{n.title}</div>
                                    <div className="notif-item-msg">{n.message}</div>
                                    <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
