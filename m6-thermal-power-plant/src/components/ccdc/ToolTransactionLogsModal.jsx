import { useEffect, useState } from 'react';
import { Modal, Badge, Spinner } from 'react-bootstrap';
import { BsClockHistory, BsBoxArrowInDown, BsExclamationOctagon } from 'react-icons/bs';
import { toolService } from '../../services/toolService';
import { toast } from 'react-toastify';

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function ToolTransactionLogsModal({ show, onClose, tool }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!show || !tool) return;
        setLoading(true);
        toolService.getTransactionLogs(tool.id)
            .then((res) => setLogs(res.data?.data ?? []))
            .catch(() => toast.error('Không thể tải lịch sử thao tác'))
            .finally(() => setLoading(false));
    }, [show, tool]);

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
                    <BsClockHistory className="me-2" style={{ color: 'var(--color-primary)' }} />
                    Lịch sử thao tác — {tool?.toolCode}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" size="sm" /> Đang tải...
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-center text-muted py-4">Chưa có lịch sử thao tác nào.</p>
                ) : (
                    <div className="tool-log-list">
                        {logs.map((log) => (
                            <div key={log.id} className="tool-log-item">
                                <div className="tool-log-icon">
                                    {log.type === 'IMPORT'
                                        ? <BsBoxArrowInDown style={{ color: 'var(--color-status-normal)' }} />
                                        : <BsExclamationOctagon style={{ color: 'var(--color-status-danger)' }} />}
                                </div>
                                <div className="tool-log-body">
                                    <div className="tool-log-header">
                                        <Badge bg={log.type === 'IMPORT' ? 'success' : 'danger'}>
                                            {log.type === 'IMPORT' ? 'Nhập kho' : 'Huỷ hư hỏng'}
                                        </Badge>
                                        <span className="tool-log-qty">
                                            {log.type === 'IMPORT' ? '+' : '-'}{log.quantity}
                                        </span>
                                        <span className="tool-log-date">{formatDate(log.createdAt)}</span>
                                    </div>
                                    {log.note && (
                                        <div className="tool-log-note">{log.note}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}
