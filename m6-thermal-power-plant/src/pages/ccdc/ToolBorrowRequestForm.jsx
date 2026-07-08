import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    BsClipboardPlus, BsSearch, BsXCircle,
    BsPersonFill, BsTools, BsCheckLg, BsArrowLeft,
    BsPlusLg, BsTrash,
} from 'react-icons/bs';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toolBorrowLogService, toolService } from '../../services/toolService';
import { accountService } from '../../services/hr/accountService';
import { authService } from '../../services/authService';
import './CcdcForm.css';

function computeDueDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}T23:59:59`;
}

function fmtDate(isoStr) {
    if (!isoStr) return '';
    return isoStr.slice(0, 10).split('-').reverse().join('/');
}

export default function ToolBorrowRequestForm() {
    const navigate = useNavigate();

    const [loadingData, setLoadingData] = useState(true);
    const [allAccounts, setAllAccounts] = useState([]);
    const [allTools, setAllTools] = useState([]);

    // ===== Form input =====
    const [accountIdSearch, setAccountIdSearch] = useState('');
    const [accountNameSearch, setAccountNameSearch] = useState('');
    const [showAccountDrop, setShowAccountDrop] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    const [toolCategorySearch, setToolCategorySearch] = useState('');
    const [toolNameSearch, setToolNameSearch] = useState('');
    const [showToolDrop, setShowToolDrop] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);

    const [quantity, setQuantity] = useState(1);
    const [borrowDate, setBorrowDate] = useState('');
    const [purpose, setPurpose] = useState('');

    // ===== Danh sách phiếu chờ tạo =====
    const [items, setItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const accountRef = useRef(null);
    const toolRef = useRef(null);

    useEffect(() => {
        let active = true;
        Promise.all([
            accountService.getAll(),
            toolService.search({ size: 1000 }),
        ]).then(([accRes, toolRes]) => {
            if (!active) return;
            setAllAccounts(accRes.data ?? []);
            const page = toolRes.data?.data;
            setAllTools(page?.content ?? page ?? []);
        }).catch(() => toast.error('Không thể tải dữ liệu'))
          .finally(() => { if (active) setLoadingData(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) setShowAccountDrop(false);
            if (toolRef.current && !toolRef.current.contains(e.target)) setShowToolDrop(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const dueDate = computeDueDate(borrowDate);

    const filteredAccounts = allAccounts.filter((a) => {
        const qId = accountIdSearch.trim();
        const qName = accountNameSearch.toLowerCase().trim();
        const matchId = !qId || String(a.id ?? '').includes(qId) || a.username?.toLowerCase().includes(qId.toLowerCase());
        const matchName = !qName || a.employee?.fullName?.toLowerCase().includes(qName);
        return matchId && matchName;
    }).slice(0, 8);

    const filteredTools = allTools.filter((t) => {
        const qCat = toolCategorySearch.toLowerCase().trim();
        const qName = toolNameSearch.toLowerCase().trim();
        const matchCat = !qCat || t.toolCategoryName?.toLowerCase().includes(qCat);
        const matchName = !qName || t.name?.toLowerCase().includes(qName) || t.toolCode?.toLowerCase().includes(qName);
        return matchCat && matchName;
    }).slice(0, 8);

    const handleAddItem = () => {
        if (!selectedAccount) { toast.warning('Vui lòng chọn người mượn'); return; }
        if (!selectedTool) { toast.warning('Vui lòng chọn CCDC'); return; }
        if (!borrowDate) { toast.warning('Vui lòng chọn ngày mượn'); return; }
        if (quantity < 1) { toast.warning('Số lượng phải lớn hơn 0'); return; }

        setItems((prev) => [...prev, {
            _key: Date.now(),
            accountId: selectedAccount.id,
            accountName: selectedAccount.employee?.fullName || selectedAccount.username,
            toolId: selectedTool.id,
            toolCode: selectedTool.toolCode,
            toolName: selectedTool.name,
            quantity,
            borrowDate,
            dueDate,
            borrowPurpose: purpose.trim(),
        }]);

        // Xoá form, giữ lại người mượn để tiện thêm CCDC tiếp
        setSelectedTool(null);
        setToolCategorySearch('');
        setToolNameSearch('');
        setQuantity(1);
        setBorrowDate('');
        setPurpose('');
        toast.success('Đã thêm vào phiếu');
    };

    const handleRemoveItem = (key) => setItems((prev) => prev.filter((i) => i._key !== key));

    const handleSubmit = async () => {
        if (items.length === 0) { toast.warning('Chưa có phiếu nào trong danh sách'); return; }

        const currentUser = authService.getCurrentUser();
        if (!currentUser?.accountId) { toast.error('Không xác định được tài khoản đang đăng nhập'); return; }

        setSubmitting(true);
        let ok = 0;
        for (const item of items) {
            try {
                const createRes = await toolBorrowLogService.createBorrowRequest(item.accountId, {
                    toolId: item.toolId,
                    quantity: item.quantity,
                    borrowPurpose: item.borrowPurpose,
                    dueDate: item.dueDate,
                });
                const borrowLogId = createRes.data?.data?.id;
                if (borrowLogId) {
                    await toolBorrowLogService.approve(borrowLogId, currentUser.accountId);
                }
                ok++;
            } catch (err) {
                toast.error(`Lỗi phiếu "${item.toolCode}": ${err.response?.data?.message || 'Lỗi không xác định'}`);
            }
        }
        setSubmitting(false);
        if (ok > 0) {
            toast.success(`Tạo thành công ${ok} phiếu mượn`);
            navigate('/ccdc/muon-tra');
        }
    };

    if (loadingData) return <LoadingSpinner text="Đang tải dữ liệu..." fullPage />;

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Lập phiếu mượn CCDC"
                subtitle="Thủ kho lập phiếu mượn thay nhân viên"
                icon={<BsClipboardPlus />}
            />

            {/* ===== FORM NHẬP ===== */}
            <div className="ccdc-form-card mb-4">
                <div className="ccdc-form-header">
                    <div className="ccdc-form-header-icon"><BsClipboardPlus /></div>
                    <div className="ccdc-form-header-text">
                        <h2>Thông tin phiếu mượn</h2>
                        <p>Điền xong nhấn "Thêm vào phiếu" — có thể thêm nhiều phiếu trước khi tạo</p>
                    </div>
                </div>

                <div className="ccdc-form-body">
                    {/* NGƯỜI MƯỢN */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold">
                            Người mượn <span className="required-asterisk">*</span>
                        </label>
                        <div ref={accountRef} className="position-relative">
                            <Row className="g-2 mb-2">
                                <Col md={5}>
                                    <div className="input-group">
                                        <span className="input-group-text"><BsSearch /></span>
                                        <input type="text" className="form-control"
                                            placeholder="Tìm theo mã / username"
                                            value={accountIdSearch}
                                            onChange={(e) => { setAccountIdSearch(e.target.value); setSelectedAccount(null); setShowAccountDrop(true); }}
                                            onFocus={() => setShowAccountDrop(true)} />
                                    </div>
                                </Col>
                                <Col md={7}>
                                    <div className="input-group">
                                        <span className="input-group-text"><BsSearch /></span>
                                        <input type="text" className="form-control"
                                            placeholder="Tìm theo tên nhân viên"
                                            value={accountNameSearch}
                                            onChange={(e) => { setAccountNameSearch(e.target.value); setSelectedAccount(null); setShowAccountDrop(true); }}
                                            onFocus={() => setShowAccountDrop(true)} />
                                    </div>
                                </Col>
                            </Row>
                            <div className="input-group">
                                <span className="input-group-text"><BsPersonFill /></span>
                                <input type="text" readOnly className="form-control bg-light"
                                    placeholder="— chọn người mượn từ kết quả tìm kiếm —"
                                    value={selectedAccount
                                        ? `${selectedAccount.employee?.fullName || selectedAccount.username}  (${selectedAccount.username} · ID: ${selectedAccount.id})`
                                        : ''} />
                                {selectedAccount && (
                                    <button type="button" className="btn btn-outline-secondary"
                                        onClick={() => { setSelectedAccount(null); setAccountIdSearch(''); setAccountNameSearch(''); }}>
                                        <BsXCircle />
                                    </button>
                                )}
                            </div>
                            {showAccountDrop && filteredAccounts.length > 0 && (
                                <div className="borrow-dropdown">
                                    {filteredAccounts.map((a) => (
                                        <div key={a.id ?? a.username} className="borrow-dropdown-item"
                                            onMouseDown={() => { setSelectedAccount(a); setShowAccountDrop(false); }}>
                                            <BsPersonFill className="text-muted me-2" />
                                            <span className="fw-semibold">{a.employee?.fullName || a.username}</span>
                                            <span className="text-muted ms-2 small">({a.username} · ID: {a.id})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showAccountDrop && (accountIdSearch || accountNameSearch) && filteredAccounts.length === 0 && (
                                <div className="borrow-dropdown">
                                    <div className="borrow-dropdown-empty">Không tìm thấy tài khoản</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CCDC */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold">
                            CCDC <span className="required-asterisk">*</span>
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

                    {/* SỐ LƯỢNG + NGÀY MƯỢN + HẠN TRẢ */}
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
                            <input type="text" readOnly className="form-control bg-light text-muted"
                                value={dueDate ? fmtDate(dueDate) : '— chọn ngày mượn trước —'} />
                        </Col>
                    </Row>

                    {/* MỤC ĐÍCH */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold">Mục đích mượn</label>
                        <textarea className="form-control" rows={2}
                            placeholder="VD: Sửa chữa bơm cấp nước thô, kiểm tra thiết bị..."
                            value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                    </div>

                    {/* NÚT THÊM VÀO PHIẾU */}
                    <div className="d-flex justify-content-end">
                        <Button variant="success" onClick={handleAddItem}>
                            <BsPlusLg className="me-1" /> Thêm vào phiếu
                        </Button>
                    </div>
                </div>
            </div>

            {/* ===== DANH SÁCH PHIẾU ===== */}
            <div className="ccdc-form-card">
                <div className="ccdc-form-header">
                    <div className="ccdc-form-header-icon">
                        <BsClipboardPlus />
                    </div>
                    <div className="ccdc-form-header-text">
                        <h2>
                            Danh sách phiếu mượn
                            <span className="ms-2 badge bg-secondary">{items.length} phiếu</span>
                        </h2>
                        <p>
                            {items.length === 0
                                ? 'Chưa có phiếu nào. Điền form bên trên rồi nhấn "Thêm vào phiếu".'
                                : 'Kiểm tra lại rồi nhấn "Tạo phiếu" để hoàn tất.'}
                        </p>
                    </div>
                </div>

                {items.length > 0 && (
                    <div style={{ overflowX: 'auto', padding: '0 var(--space-4)' }}>
                        <Table hover size="sm" className="mb-3">
                            <thead>
                                <tr>
                                    <th style={{ width: 36 }}>#</th>
                                    <th>Người mượn</th>
                                    <th>CCDC</th>
                                    <th style={{ width: 60 }}>SL</th>
                                    <th style={{ width: 110 }}>Ngày mượn</th>
                                    <th style={{ width: 110 }}>Hạn trả</th>
                                    <th>Mục đích</th>
                                    <th style={{ width: 50 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item._key}>
                                        <td className="text-muted">{idx + 1}</td>
                                        <td className="fw-semibold">{item.accountName}</td>
                                        <td>
                                            <span className="fw-semibold">{item.toolName}</span>
                                            <span className="text-muted ms-1 small">({item.toolCode})</span>
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td className="small">{fmtDate(item.borrowDate)}</td>
                                        <td className="small">{fmtDate(item.dueDate)}</td>
                                        <td className="small text-muted">{item.borrowPurpose || '—'}</td>
                                        <td>
                                            <button type="button" className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleRemoveItem(item._key)} title="Xoá">
                                                <BsTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                <div className="ccdc-form-footer">
                    <Button variant="outline-secondary" onClick={() => navigate('/ccdc/muon-tra')} disabled={submitting}>
                        <BsArrowLeft className="me-1" /> Quay lại
                    </Button>
                    <Button variant="primary" disabled={items.length === 0 || submitting} onClick={handleSubmit}>
                        <BsCheckLg className="me-1" />
                        {submitting ? 'Đang tạo...' : `Tạo phiếu (${items.length} phiếu)`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
