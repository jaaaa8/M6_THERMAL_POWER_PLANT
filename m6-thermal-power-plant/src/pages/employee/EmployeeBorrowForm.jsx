import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    BsClipboardPlus, BsSearch, BsXCircle,
    BsTools, BsCheckLg, BsArrowLeft, BsPersonFill, BsClock,
} from 'react-icons/bs';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toolBorrowLogService, toolService } from '../../services/toolService';
import { authService } from '../../services/authService';
import '../../pages/ccdc/CcdcForm.css';

function computeDueDate(dateStr) {
    if (!dateStr) return '';
    // TEST: +5 phút (đổi lại thành +7 ngày sau khi test xong)
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtDate(isoStr) {
    if (!isoStr) return '';
    return isoStr.slice(0, 10).split('-').reverse().join('/');
}

export default function EmployeeBorrowForm() {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    const [loadingData, setLoadingData] = useState(true);
    const [allTools, setAllTools] = useState([]);

    const [toolCategorySearch, setToolCategorySearch] = useState('');
    const [toolNameSearch, setToolNameSearch] = useState('');
    const [showToolDrop, setShowToolDrop] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);

    const [quantity, setQuantity] = useState(1);
    const [borrowDate, setBorrowDate] = useState('');
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const toolRef = useRef(null);

    useEffect(() => {
        toolService.search({ size: 1000 })
            .then((res) => {
                const page = res.data?.data;
                setAllTools(page?.content ?? page ?? []);
            })
            .catch(() => toast.error('Không thể tải danh sách CCDC'))
            .finally(() => setLoadingData(false));
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (toolRef.current && !toolRef.current.contains(e.target)) setShowToolDrop(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const dueDate = computeDueDate(borrowDate);

    const filteredTools = allTools.filter((t) => {
        const qCat = toolCategorySearch.toLowerCase().trim();
        const qName = toolNameSearch.toLowerCase().trim();
        const matchCat = !qCat || t.toolCategoryName?.toLowerCase().includes(qCat);
        const matchName = !qName || t.name?.toLowerCase().includes(qName) || t.toolCode?.toLowerCase().includes(qName);
        return matchCat && matchName;
    }).slice(0, 8);

    const handleSubmit = async () => {
        if (!selectedTool) { toast.warning('Vui lòng chọn CCDC'); return; }
        if (!borrowDate) { toast.warning('Vui lòng chọn ngày mượn'); return; }
        if (quantity < 1) { toast.warning('Số lượng phải lớn hơn 0'); return; }
        if (!currentUser?.accountId) { toast.error('Không xác định được tài khoản'); return; }

        setSubmitting(true);
        try {
            await toolBorrowLogService.createBorrowRequest(currentUser.accountId, {
                toolId: selectedTool.id,
                quantity,
                borrowPurpose: purpose.trim(),
                dueDate,
            });
            setSubmitted(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi gửi yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) return <LoadingSpinner text="Đang tải dữ liệu..." fullPage />;

    if (submitted) {
        return (
            <div className="animate-fade-in text-center" style={{ padding: '60px 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Đã gửi yêu cầu!</h2>
                <p style={{ color: 'var(--text-tertiary)', marginBottom: '32px' }}>
                    Yêu cầu mượn <strong>{selectedTool?.name}</strong> đang chờ thủ kho duyệt.<br />
                    Bạn sẽ nhận thông báo khi được duyệt.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                    <Button variant="outline-secondary" onClick={() => navigate('/employee')}>
                        Về trang chủ
                    </Button>
                    <Button variant="primary" onClick={() => { setSubmitted(false); setSelectedTool(null); setToolCategorySearch(''); setToolNameSearch(''); setQuantity(1); setBorrowDate(''); setPurpose(''); }}>
                        Tạo yêu cầu khác
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Yêu cầu mượn CCDC"
                subtitle="Điền thông tin và gửi yêu cầu — thủ kho sẽ duyệt sớm nhất"
                icon={<BsClipboardPlus />}
            />

            <div className="ccdc-form-card">
                <div className="ccdc-form-header">
                    <div className="ccdc-form-header-icon"><BsClipboardPlus /></div>
                    <div className="ccdc-form-header-text">
                        <h2>Thông tin yêu cầu mượn</h2>
                        <p>Chọn CCDC và điền thông tin bên dưới rồi nhấn "Gửi yêu cầu"</p>
                    </div>
                </div>

                <div className="ccdc-form-body">
                    {/* NGƯỜI MƯỢN — tự động từ account đăng nhập */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold">Người mượn</label>
                        <div className="input-group">
                            <span className="input-group-text"><BsPersonFill /></span>
                            <input type="text" readOnly className="form-control bg-light"
                                value={`${currentUser?.fullName || currentUser?.username}  (${currentUser?.username})`} />
                        </div>
                        <div className="form-text">Thông tin tự động lấy từ tài khoản đang đăng nhập</div>
                    </div>

                    {/* CCDC */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold">
                            CCDC muốn mượn <span className="required-asterisk">*</span>
                        </label>
                        <div ref={toolRef} className="position-relative">
                            <Row className="g-2 mb-2">
                                <Col md={5}>
                                    <div className="input-group">
                                        <span className="input-group-text"><BsSearch /></span>
                                        <input type="text" className="form-control"
                                            placeholder="Tìm theo chủng loại"
                                            value={toolCategorySearch}
                                            onChange={(e) => { setToolCategorySearch(e.target.value); setShowToolDrop(true); }}
                                            onFocus={() => setShowToolDrop(true)} />
                                    </div>
                                </Col>
                                <Col md={7}>
                                    <div className="input-group">
                                        <span className="input-group-text"><BsSearch /></span>
                                        <input type="text" className="form-control"
                                            placeholder="Tìm theo tên / mã CCDC"
                                            value={toolNameSearch}
                                            onChange={(e) => { setToolNameSearch(e.target.value); setSelectedTool(null); setShowToolDrop(true); }}
                                            onFocus={() => setShowToolDrop(true)} />
                                    </div>
                                </Col>
                            </Row>
                            <div className="input-group">
                                <span className="input-group-text"><BsTools /></span>
                                <input type="text" readOnly className="form-control bg-light"
                                    placeholder="— chọn CCDC từ kết quả tìm kiếm —"
                                    value={selectedTool
                                        ? `${selectedTool.name}  (${selectedTool.toolCode} · ${selectedTool.toolCategoryName} · Khả dụng: ${selectedTool.quantityAvailable})`
                                        : ''} />
                                {selectedTool && (
                                    <button type="button" className="btn btn-outline-secondary"
                                        onClick={() => { setSelectedTool(null); setToolCategorySearch(''); setToolNameSearch(''); }}>
                                        <BsXCircle />
                                    </button>
                                )}
                            </div>
                            {showToolDrop && filteredTools.length > 0 && (
                                <div className="borrow-dropdown">
                                    {filteredTools.map((t) => (
                                        <div key={t.id}
                                            className={`borrow-dropdown-item ${t.quantityAvailable <= 0 ? 'borrow-dropdown-disabled' : ''}`}
                                            onMouseDown={() => {
                                                if (t.quantityAvailable <= 0) { toast.warning('CCDC này đã hết hàng khả dụng'); return; }
                                                setSelectedTool(t); setShowToolDrop(false);
                                            }}>
                                            <BsTools className="text-muted me-2" />
                                            <span className="fw-semibold">{t.name}</span>
                                            <span className="text-muted ms-2 small">
                                                {t.toolCode} · {t.toolCategoryName} · KD: {t.quantityAvailable}
                                                {t.quantityAvailable <= 0 && <span className="text-danger ms-1">(Hết)</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showToolDrop && (toolCategorySearch || toolNameSearch) && filteredTools.length === 0 && (
                                <div className="borrow-dropdown">
                                    <div className="borrow-dropdown-empty">Không tìm thấy CCDC</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SỐ LƯỢNG + NGÀY + HẠN TRẢ */}
                    <Row className="g-3 mb-4">
                        <Col md={3}>
                            <label className="form-label fw-semibold">Số lượng <span className="required-asterisk">*</span></label>
                            <input type="number" min={1} value={quantity} className="form-control"
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                        </Col>
                        <Col md={4}>
                            <label className="form-label fw-semibold">Ngày mượn <span className="required-asterisk">*</span></label>
                            <input type="date" className="form-control" value={borrowDate}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setBorrowDate(e.target.value)} />
                        </Col>
                        <Col md={5}>
                            <label className="form-label fw-semibold">
                                Hạn trả <span className="text-muted small fw-normal">(+7 ngày)</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text"><BsClock /></span>
                                <input type="text" readOnly className="form-control bg-light text-muted"
                                    value={dueDate ? fmtDate(dueDate) : '— chọn ngày mượn trước —'} />
                            </div>
                        </Col>
                    </Row>

                    {/* MỤC ĐÍCH */}
                    <div className="mb-0">
                        <label className="form-label fw-semibold">Mục đích mượn</label>
                        <textarea className="form-control" rows={2}
                            placeholder="VD: Sửa chữa bơm cấp nước thô, kiểm tra thiết bị..."
                            value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                    </div>
                </div>

                <div className="ccdc-form-footer">
                    <Button variant="outline-secondary" onClick={() => navigate('/employee')} disabled={submitting}>
                        <BsArrowLeft className="me-1" /> Quay lại
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                        <BsCheckLg className="me-1" />
                        {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
