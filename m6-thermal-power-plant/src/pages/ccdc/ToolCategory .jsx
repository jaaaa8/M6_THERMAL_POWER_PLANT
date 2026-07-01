import { useCallback, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { BsTags, BsPlusLg, BsArrowClockwise, BsPencil, BsTrash } from 'react-icons/bs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToolCategoryFormModal from '../../components/ccdc/ToolCategoryFormModal';
import { toolCategoryService } from '../../services/toolService';

import './ToolList.css';

export default function ToolCategory() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formCategory, setFormCategory] = useState(undefined); // undefined = đóng, null = thêm mới, object = sửa
    const [deleteCategory, setDeleteCategory] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await toolCategoryService.getAll();
            setCategories(res.data?.data ?? []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể tải danh sách chủng loại');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const columns = [
        { key: 'categoryCode', label: 'Mã chủng loại', mono: true, width: 150 },
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
                        <Button variant="outline-secondary" size="sm" onClick={loadData}>
                            <BsArrowClockwise className="me-1" /> Làm mới
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => setFormCategory(null)}>
                            <BsPlusLg className="me-1" /> Thêm chủng loại
                        </Button>
                    </>
                }
            />

            <DataTable
                columns={columns}
                data={categories}
                loading={loading}
                searchPlaceholder="Tìm theo mã, tên chủng loại..."
                pageSize={10}
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