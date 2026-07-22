import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { BsArrowClockwise, BsPencil, BsSearch, BsTags, BsTrash, BsPlusLg } from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToolCategoryFormModal from '../../components/ccdc/ToolCategoryFormModal';
import { toolCategoryService } from '../../services/toolService';
import './ToolList.css';

export default function ToolCategory() {
    const [loading, setLoading] = useState(true);

    const [allCategories, setAllCategories] = useState([]);
    const [codeInput, setCodeInput] = useState('');
    const [nameInput, setNameInput] = useState('');

    const [formCategory, setFormCategory] = useState(undefined);
    const [deleteCategory, setDeleteCategory] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await toolCategoryService.getAll();
            setAllCategories(res.data?.data ?? []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể tải danh sách chủng loại');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Filter phía frontend
    const categories = allCategories.filter((c) => {
        const code = codeInput.trim().toLowerCase();
        const name = nameInput.trim().toLowerCase();
        const matchCode = !code || c.categoryCode?.toLowerCase().includes(code);
        const matchName = !name || c.categoryName?.toLowerCase().includes(name);
        return matchCode && matchName;
    });

    const handleRefresh = () => {
        setCodeInput('');
        setNameInput('');
    };

    const columns = [
        { key: 'categoryCode', label: 'Mã chủng loại', mono: true, width: 160 },
        { key: 'categoryName', label: 'Tên chủng loại' },
        { key: 'description', label: 'Mô tả' },
    ];

    const handleDelete = async () => {
        if (!deleteCategory) return;
        setDeleting(true);
        try {
            await toolCategoryService.remove(deleteCategory.id);
            toast.success('Xoá chủng loại thành công');
            setDeleteCategory(null);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể xoá chủng loại (có thể đang được CCDC sử dụng)');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Chủng loại CCDC"
                subtitle="Quản lý danh mục chủng loại công cụ dụng cụ"
                icon={<BsTags />}
                actions={
                    <>
                        <Button variant="outline-secondary" size="sm" onClick={handleRefresh}>
                            <BsArrowClockwise className="me-1" /> Làm mới
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => setFormCategory(null)}>
                            <BsPlusLg className="me-1" /> Thêm chủng loại
                        </Button>
                    </>
                }
            />

            <Row className="g-2 mb-3">
                <Col md={4}>
                    <div className="ccdc-search-input">
                        <BsSearch className="ccdc-search-icon" />
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo mã chủng loại..."
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                        />
                    </div>
                </Col>
                <Col md={5}>
                    <div className="ccdc-search-input">
                        <BsSearch className="ccdc-search-icon" />
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo tên chủng loại..."
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                        />
                    </div>
                </Col>
            </Row>

            <DataTable
                columns={columns}
                data={categories}
                loading={loading}
                searchable={false}
                pageSize={5}
                renderActions={(row) => (
                    <div className="data-table-actions">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setFormCategory(row)} title="Sửa">
                            <BsPencil />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteCategory(row)} title="Xoá">
                            <BsTrash />
                        </button>
                    </div>
                )}
            />

            <ToolCategoryFormModal
                show={formCategory !== undefined}
                category={formCategory}
                onClose={() => setFormCategory(undefined)}
                onSaved={loadData}
            />
            <ConfirmModal
                show={!!deleteCategory}
                onClose={() => setDeleteCategory(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Xoá chủng loại"
                message={deleteCategory ? `Bạn có chắc muốn xoá chủng loại "${deleteCategory.categoryName}" (${deleteCategory.categoryCode})?` : ''}
            />
        </div>
    );
}
