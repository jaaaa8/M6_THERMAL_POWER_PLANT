import { useState } from 'react';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    BsPersonPlus, BsEye, BsEyeSlash, BsCheckCircle,
    BsClipboard, BsClipboardCheck, BsPersonBadge, BsEnvelope,
} from 'react-icons/bs';
import PageHeader from '../../components/common/PageHeader';
import apiClient from '../../services/apiClient';

export default function CreateWorkerAccountPage() {
    const [form, setForm] = useState({ fullName: '', username: '', password: '', email: '' });
    const [testEmailAddr, setTestEmailAddr] = useState('');
    const [testingSend, setTestingSend] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [created, setCreated] = useState(null);
    const [copied, setCopied] = useState({});

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName.trim()) { toast.warning('Vui lòng nhập họ tên'); return; }
        if (form.username.length < 3) { toast.warning('Username tối thiểu 3 ký tự'); return; }
        if (form.password.length < 6) { toast.warning('Mật khẩu tối thiểu 6 ký tự'); return; }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.warning('Email không hợp lệ'); return; }

        setSubmitting(true);
        try {
            const res = await apiClient.post('/api/v1/accounts/worker', form);
            setCreated(res.data?.data ?? res.data);
            setForm({ fullName: '', username: '', password: '' });
            toast.success('Tạo tài khoản nhân sự thành công!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi tạo tài khoản');
        } finally {
            setSubmitting(false);
        }
    };

    const copyText = (key, text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied({ ...copied, [key]: true });
            setTimeout(() => setCopied((c) => ({ ...c, [key]: false })), 2000);
        });
    };

    return (
        <div>
            <PageHeader
                title="Tạo tài khoản nhân sự"
                subtitle="Tạo tài khoản cho nhân viên đăng nhập cổng mượn CCDC"
                icon={<BsPersonBadge />}
            />

            {/* Form */}
            <div className="ccdc-form-card" style={{ maxWidth: 560 }}>
                <div className="ccdc-form-header">
                    <div className="ccdc-form-header-icon"><BsPersonPlus /></div>
                    <div className="ccdc-form-header-text">
                        <h2>Thông tin tài khoản</h2>
                        <p>Điền thông tin rồi nhấn Tạo — mật khẩu sẽ hiện ngay trên màn hình</p>
                    </div>
                </div>

                <div className="ccdc-form-body">
                    <Form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Họ và tên <span className="required-asterisk">*</span></label>
                            <input
                                type="text" className="form-control" name="fullName"
                                placeholder="VD: Nguyen Van A"
                                value={form.fullName} onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">
                                Email <span className="text-muted small fw-normal">(nhận thông báo hết hạn mượn)</span>
                            </label>
                            <input
                                type="email" className="form-control" name="email"
                                placeholder="VD: nhanvien@example.com"
                                value={form.email} onChange={handleChange}
                            />
                        </div>

                        <Row className="g-3 mb-3">
                            <Col md={6}>
                                <label className="form-label fw-semibold">Username <span className="required-asterisk">*</span></label>
                                <input
                                    type="text" className="form-control" name="username"
                                    placeholder="VD: nhanvien01"
                                    value={form.username} onChange={handleChange}
                                    autoComplete="off"
                                />
                            </Col>
                            <Col md={6}>
                                <label className="form-label fw-semibold">Mật khẩu <span className="required-asterisk">*</span></label>
                                <div className="input-group">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        className="form-control" name="password"
                                        placeholder="Tối thiểu 6 ký tự"
                                        value={form.password} onChange={handleChange}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="btn btn-outline-secondary"
                                        onClick={() => setShowPw(!showPw)}>
                                        {showPw ? <BsEyeSlash /> : <BsEye />}
                                    </button>
                                </div>
                            </Col>
                        </Row>

                        <div className="ccdc-form-footer" style={{ paddingTop: 0, borderTop: 'none' }}>
                            <Button variant="primary" type="submit" disabled={submitting}>
                                <BsCheckCircle className="me-1" />
                                {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>

            {/* Credentials card */}
            {created && (
                <div style={{
                    maxWidth: 560, marginTop: 20,
                    background: 'var(--bg-surface)',
                    border: '2px solid var(--color-primary-400)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '20px 24px',
                    boxShadow: 'var(--shadow-lg)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <BsCheckCircle style={{ color: 'var(--color-status-success)', fontSize: '1.3rem' }} />
                        <span style={{ fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                            Tạo thành công — Thông tin đăng nhập
                        </span>
                    </div>

                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                        Ghi lại thông tin này để đăng nhập vào cổng nhân viên tại <code>/employee</code>
                    </p>

                    {[
                        { label: 'Họ tên', key: 'fullName', value: created.fullName },
                        { label: 'Email', key: 'email', value: created.email },
                        { label: 'Username', key: 'username', value: created.username },
                        { label: 'Mật khẩu', key: 'password', value: created.password },
                    ].filter(item => item.value).map(({ label, key, value }) => (
                        <div key={key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', marginBottom: 8,
                            background: 'var(--bg-body)', borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-color)',
                        }}>
                            <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>{label}</div>
                                <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                    {value}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                style={{ flexShrink: 0 }}
                                onClick={() => copyText(key, value)}
                                title="Sao chép"
                            >
                                {copied[key] ? <BsClipboardCheck style={{ color: 'var(--color-status-success)' }} /> : <BsClipboard />}
                            </button>
                        </div>
                    ))}

                    <div style={{
                        marginTop: 12, padding: '10px 14px',
                        background: 'rgba(var(--color-primary-rgb, 59,130,246), 0.08)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
                    }}>
                        Đăng nhập tại trang chủ → tự động chuyển sang cổng nhân viên
                    </div>
                </div>
            )}
        </div>
    );
}
