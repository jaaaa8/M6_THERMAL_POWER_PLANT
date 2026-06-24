import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import {
  BsTools, BsPlusLg, BsArrowClockwise, BsPencil, BsBoxArrowInDown,
  BsExclamationOctagon, BsTrash, BsBoxSeam, BsArrowLeftRight,
  BsExclamationTriangle, BsCheckCircle,
} from 'react-icons/bs';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToolQuantityModal from '../../components/ccdc/ToolQuantityModal';
import ToolDamageModal from '../../components/ccdc/ToolDamageModal';
import { toolService, toolCategoryService } from '../../services/toolService';
import { SAMPLE_TOOLS, SAMPLE_CATEGORIES } from './sampleData';
import { toast } from 'react-toastify';
import './DanhSachCCDC.css';

export default function DanhSachCCDC() {
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [quantityTool, setQuantityTool] = useState(null);
  const [damageTool, setDamageTool] = useState(null);
  const [deleteTool, setDeleteTool] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* --- Load dữ liệu (fallback dữ liệu mẫu nếu chưa kết nối API) --- */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [toolsRes, categoriesRes] = await Promise.all([
        toolService.search({}),
        toolCategoryService.getAll(),
      ]);
      if (typeof toolsRes.data !== 'object' || typeof categoriesRes.data !== 'object') {
        throw new Error('API trả về dữ liệu không hợp lệ (có thể chưa kết nối backend)');
      }
      const toolPage = toolsRes.data?.data;
      setTools(toolPage?.content ?? toolPage ?? []);
      setCategories(categoriesRes.data?.data ?? []);
      setUsingSampleData(false);
    } catch {
      setTools(SAMPLE_TOOLS);
      setCategories(SAMPLE_CATEGORIES);
      setUsingSampleData(true);
      toast.info('Chưa kết nối được API — đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* --- Lọc theo chủng loại --- */
  const filtered = useMemo(() => {
    if (categoryFilter === 'ALL') return tools;
    return tools.filter((t) => String(t.toolCategoryId) === String(categoryFilter));
  }, [tools, categoryFilter]);

  /* --- Thống kê --- */
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
  const handleSaved = () => loadData();

  const handleDelete = async () => {
    if (!deleteTool) return;
    setDeleting(true);
    try {
      await toolService.remove(deleteTool.id);
      toast.success('Xoá CCDC thành công');
      setDeleteTool(null);
      loadData();
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
        subtitle={usingSampleData ? 'Đang xem dữ liệu mẫu (chưa kết nối API)' : 'Quản lý danh sách, số lượng và tình trạng công cụ dụng cụ'}
        icon={<BsTools />}
        actions={
          <>
            <Button variant="outline-secondary" size="sm" onClick={loadData}>
              <BsArrowClockwise className="me-1" /> Làm mới
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

      {/* ===== FILTER PILLS: CHỦNG LOẠI ===== */}
      <div className="ccdc-filter-pills">
        <button
          className={`ccdc-pill ${categoryFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('ALL')}
        >
          Tất cả
          <span className="ccdc-pill-count">{tools.length}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`ccdc-pill ${String(categoryFilter) === String(c.id) ? 'active' : ''}`}
            onClick={() => setCategoryFilter(c.id)}
          >
            {c.categoryName}
            <span className="ccdc-pill-count">
              {tools.filter((t) => String(t.toolCategoryId) === String(c.id)).length}
            </span>
          </button>
        ))}
      </div>

      {/* ===== TABLE ===== */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Tìm theo mã CCDC, tên loại..."
        pageSize={10}
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
