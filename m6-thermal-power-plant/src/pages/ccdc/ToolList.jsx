import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Row, Col } from 'react-bootstrap';
import {
    BsTools, BsPlusLg, BsArrowClockwise, BsPencil, BsBoxArrowInDown,
    BsExclamationOctagon, BsTrash, BsBoxSeam, BsArrowLeftRight,
    BsExclamationTriangle, BsCheckCircle, BsTags, BsImage, BsSearch,
    BsClockHistory,
} from 'react-icons/bs';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToolQuantityModal from '../../components/ccdc/ToolQuantityModal';
import ToolDamageModal from '../../components/ccdc/ToolDamageModal';
import ToolTransactionLogsModal from '../../components/ccdc/ToolTransactionLogsModal';
import { toolService, toolCategoryService } from '../../services/toolService';

import { toast } from 'react-toastify';
import './ToolList.css';

export default function ToolList() {
    const navigate = useNavigate();
    const [tools, setTools] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);


    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const debounceRef = useRef(null);

    const [quantityTool, setQuantityTool] = useState(null);
    const [damageTool, setDamageTool] = useState(null);
    const [deleteTool, setDeleteTool] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [logsTool, setLogsTool] = useState(null);


    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setKeyword(keywordInput.trim());
        }, 400);
        return () => clearTimeout(debounceRef.current);
    }, [keywordInput]);

    const loadCategories = useCallback(async () => {
        try {
            const res = await toolCategoryService.getAll();
            setCategories(res.data?.data ?? []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể tải danh sách chủng loại');
        }
    }, []);

    const loadTools = useCallback(async () => {
        setLoading(true);
        try {
            const res = await toolService.search({
                keyword: keyword || undefined,
                categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
            });
            const toolPage = res.data?.data;
            const list = toolPage?.content ?? toolPage ?? [];
            // CCDC mới thêm (id lớn nhất) hiển thị lên đầu danh sách
            setTools([...list].sort((a, b) => (b.id || 0) - (a.id || 0)));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể tải danh sách CCDC');
        } finally {
            setLoading(false);
        }
    }, [keyword, categoryFilter]);

    useEffect(() => { loadCategories(); }, [loadCategories]);
    useEffect(() => { loadTools(); }, [loadTools]);

    const handleRefresh = () => {
        loadCategories();
        loadTools();
    };

    const stats = useMemo(() => {
        const totalQuantity = tools.reduce((sum, t) => sum + (t.quantity || 0), 0);
        const totalBorrowed = tools.reduce((sum, t) => sum + (t.quantityBorrowed || 0), 0);
        const totalDamaged = tools.reduce((sum, t) => sum + (t.quantityDamaged || 0), 0);
        return [
            { key: 'types', label: 'Số đầu mục CCDC', value: tools.length, icon: <BsBoxSeam />, color: 'var(--color-primary-500)' },
            { key: 'total', label: 'Tổng số lượng trong kho', value: totalQuantity, icon: <BsCheckCircle />, color: 'var(--color-status-normal)' },
            { key: 'borrowed', label: 'Đang được mượn', value: totalBorrowed, icon: <BsArrowLeftRight />, color: 'var(--color-status-info)' },
            { key: 'damaged', label: 'Hư hỏng / đã huỷ', value: totalDamaged, icon: <BsExclamationTriangle />, color: 'var(--color-status-danger)' },
        ];
    }, [tools]);

    /* --- Cột bảng --- */
    const columns = [
        {
            key: 'imgPath', label: 'Ảnh', width: 70,
            render: (val) => (
                val ? (
                    <img
                        src={val}
                        alt="Ảnh CCDC"
                        className="ccdc-thumb"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="ccdc-thumb ccdc-thumb-placeholder">
                        <BsImage />
                    </div>
                )
            ),
        },
        { key: 'toolCode', label: 'Mã CCDC', mono: true, width: 130 },
        { key: 'name', label: 'Tên loại' },
        { key: 'toolCategoryName', label: 'Chủng loại', width: 140 },
        { key: 'unit', label: 'Đơn vị', width: 90 },
        { key: 'quantity', label: 'SL tổng', width: 90 },
        {
            key: 'quantityBorrowed', label: 'Đang mượn', width: 110,
            render: (val) => val > 0 ? <StatusBadge status="info" label={`${val}`} /> : <span className="text-muted">0</span>,
        },
        {
            key: 'quantityDamaged', label: 'Hư hỏng', width: 100,
            render: (val) => val > 0 ? <StatusBadge status="danger" label={`${val}`} /> : <span className="text-muted">0</span>,
        },
        {
            key: 'quantityAvailable', label: 'Khả dụng', width: 100,
            render: (val) => (
                <span className={`ccdc-available ${val <= 0 ? 'zero' : ''}`}>{val}</span>
            ),
        },
    ];

    /* --- Handlers --- */
    const handleSaved = () => loadTools();

    const handleDelete = async () => {
        if (!deleteTool) return;
        setDeleting(true);
        try {
            await toolService.remove(deleteTool.id);
            toast.success('Xoá CCDC thành công');
            setDeleteTool(null);
            loadTools();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể xoá CCDC');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Danh mục CCDC trong kho"
                subtitle="Quản lý danh sách, số lượng và tình trạng công cụ dụng cụ"
                icon={<BsTools />}
                actions={
                    <>
                        <Button variant="outline-secondary" size="sm" onClick={handleRefresh}>
                            <BsArrowClockwise className="me-1" /> Làm mới
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => navigate('/ccdc/chung-loai')}>
                            <BsTags className="me-1" /> Chủng loại
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => navigate('/ccdc/danh-sach/them-moi')}>
                            <BsPlusLg className="me-1" /> Thêm CCDC
                        </Button>
                    </>
                }
            />

            {/* ===== STATS ===== */}
            <div className="ccdc-stats">
                {stats.map((s) => (
                    <div key={s.key} className="ccdc-stat surface-card">
                        <span className="ccdc-stat-icon" style={{ color: s.color }}>{s.icon}</span>
                        <div className="ccdc-stat-body">
                            <span className="ccdc-stat-value">{s.value}</span>
                            <span className="ccdc-stat-label">{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== 2 Ô TÌM KIẾM: TÊN & CHỦNG LOẠI (gọi API thật) ===== */}
            <Row className="g-2 mb-3">
                <Col md={7}>
                    <div className="ccdc-search-input">
                        <BsSearch className="ccdc-search-icon" />
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo tên loại CCDC..."
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                        />
                    </div>
                </Col>
                <Col md={5}>
                    <Form.Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả chủng loại</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.categoryName}</option>
                        ))}
                    </Form.Select>
                </Col>
            </Row>

            {/* ===== TABLE ===== */}
            <DataTable
                columns={columns}
                data={tools}
                loading={loading}
                pageSize={5}
                searchable={false}
                renderActions={(row) => (
                    <div className="data-table-actions">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/ccdc/danh-sach/sua/${row.id}`)} title="Sửa thông tin">
                            <BsPencil />
                        </button>
                        <button className="btn btn-sm btn-outline-success" onClick={() => setQuantityTool(row)} title="Nhập kho">
                            <BsBoxArrowInDown />
                        </button>
                        <button className="btn btn-sm btn-outline-warning" onClick={() => setDamageTool(row)} title="Huỷ hư hỏng">
                            <BsExclamationOctagon />
                        </button>
                        <button className="btn btn-sm btn-outline-info" onClick={() => setLogsTool(row)} title="Lịch sử thao tác">
                            <BsClockHistory />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTool(row)} title="Xoá CCDC">
                            <BsTrash />
                        </button>
                    </div>
                )}
            />

            {/* ===== MODALS ===== */}
            <ToolQuantityModal
                show={!!quantityTool}
                tool={quantityTool}
                onClose={() => setQuantityTool(null)}
                onSaved={handleSaved}
            />
            <ToolDamageModal
                show={!!damageTool}
                tool={damageTool}
                onClose={() => setDamageTool(null)}
                onSaved={handleSaved}
            />
            <ToolTransactionLogsModal
                show={!!logsTool}
                tool={logsTool}
                onClose={() => setLogsTool(null)}
            />
            <ConfirmModal
                show={!!deleteTool}
                onClose={() => setDeleteTool(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Xoá CCDC"
                message={deleteTool ? `Bạn có chắc muốn xoá CCDC "${deleteTool.name}" (${deleteTool.toolCode})?` : ''}
            />
        </div>
    );
}