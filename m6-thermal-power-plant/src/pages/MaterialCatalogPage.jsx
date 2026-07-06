import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, Tab, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { BsPlusLg, BsImage, BsBoxSeam } from 'react-icons/bs';

import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import * as consumableService from '../services/consumableService.js';
import * as sparePartService  from '../services/sparePartService.js';


import ConsumableSearchForm from '../components/consumable/ConsumableSearchForm';
import ConsumableFormModal from '../components/consumable/ConsumableFormModal';
import SparePartSearchForm from '../components/spare_part/SparePartSearchForm';
import SparePartFormModal from '../components/spare_part/SparePartFormModal';
import MaterialDetailModal from '../components/consumable/MaterialDetailModal.jsx';

export default function MaterialCatalogPage() {
    const [activeTab, setActiveTab] = useState('consumables');
    const [isLoading, setIsLoading] = useState(false);

    // States chứa danh sách tải về từ API
    const [consumablesList, setConsumablesList] = useState([]);
    const [sparePartsList, setSparePartsList] = useState([]);

    // States tìm kiếm (Filters) - Chỉ lưu giá trị nhập trên form, không tự động query real-time
    const [consumableFilters, setConsumableFilters] = useState({
        code: '',
        name: '',
        manufacturer: '',
        status: ''
    });

    const [sparePartFilters, setSparePartFilters] = useState({
        code: '',
        name: '',
        manufacturer: '',
        status: ''
    });

    // States quản lý Modals
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // null = Thêm mới, object = Sửa

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingItem, setViewingItem] = useState(null);

    /* ============================================================
       1. TẢI DỮ LIỆU TỪ API (FETCH FUNCTIONS) - Nhận filters từ tham số truyền vào
       ============================================================ */
    const fetchConsumables = useCallback(async (filters) => {
        setIsLoading(true);
        try {
            const params = {
                code: filters?.code?.trim() || undefined,
                name: filters?.name?.trim() || undefined,
                manufacturer: filters?.manufacturer?.trim() || undefined,
                status: filters?.status || undefined,
                page: 0,
                size: 100,
                sort: 'id,desc'
            };
            const response = await consumableService.search(params);
            setConsumablesList(response.data.content || []);
        } catch (error) {
            console.error('Lỗi khi tải vật tư tiêu hao:', error);
            toast.error('Không thể kết nối API tải danh sách vật tư tiêu hao.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSpareParts = useCallback(async (filters) => {
        setIsLoading(true);
        try {
            const params = {
                code: filters?.code?.trim() || undefined,
                name: filters?.name?.trim() || undefined,
                manufacturer: filters?.manufacturer?.trim() || undefined,
                status: filters?.status || undefined,
                page: 0,
                size: 100,
                sort: 'id,desc'
            };
            const response = await sparePartService.search(params);
            setSparePartsList(response.data.content || []);
        } catch (error) {
            console.error('Lỗi khi tải vật tư thay thế:', error);
            toast.error('Không thể kết nối API tải danh sách vật tư thay thế.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Chỉ tự động tải dữ liệu ban đầu hoặc khi đổi tab (không chạy khi gõ ô search)
    useEffect(() => {
        if (activeTab === 'consumables') {
            fetchConsumables(consumableFilters);
        } else {
            fetchSpareParts(sparePartFilters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    /* ============================================================
       2. XỬ LÝ LỌC / TÌM KIẾM (SEARCH HANDLERS)
       ============================================================ */
    const handleFilterChange = (e, type) => {
        const { name, value } = e.target;
        if (type === 'consumable') {
            setConsumableFilters(prev => ({ ...prev, [name]: value }));
        } else {
            setSparePartFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleApplyFilter = (e, type) => {
        e.preventDefault();
        if (type === 'consumable') {
            fetchConsumables(consumableFilters);
        } else {
            fetchSpareParts(sparePartFilters);
        }
    };

    const handleResetFilter = (type) => {
        const defaults = { code: '', name: '', manufacturer: '', status: '' };
        if (type === 'consumable') {
            setConsumableFilters(defaults);
            fetchConsumables(defaults);
        } else {
            setSparePartFilters(defaults);
            fetchSpareParts(defaults);
        }
    };

    /* ============================================================
       3. XỬ LÝ XÓA VẬT TƯ (DELETE HANDLERS)
       ============================================================ */
    const triggerDelete = (item) => {
        setDeletingItem(item);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setDeletingLoading(true);
        try {
            if (activeTab === 'consumables') {
                await consumableService.delete(deletingItem.id);
                toast.success(`Đã xoá vật tư tiêu hao: ${deletingItem.name}`);
                fetchConsumables(consumableFilters);
            } else {
                await sparePartService.delete(deletingItem.id);
                toast.success(`Đã xoá vật tư thay thế: ${deletingItem.name}`);
                fetchSpareParts(sparePartFilters);
            }
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Lỗi khi xoá vật tư:', error);
            toast.error('Có lỗi xảy ra khi xoá vật tư. Vui lòng thử lại.');
        } finally {
            setDeletingLoading(false);
            setDeletingItem(null);
        }
    };

    /* ============================================================
       4. ĐỊNH NGHĨA CỘT BẢNG (DATATABLE COLUMNS)
       ============================================================ */
    const columnsConsumable = useMemo(() => [
        {
            key: 'imgPath',
            label: 'Hình ảnh',
            sortable: false,
            width: 90,
            render: (val) => {
                const firstImg = val ? val.split('|').filter(Boolean)[0] : null;
                return (
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {firstImg ? (
                            <img src={firstImg} alt="vật tư" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '📷'; }} />
                        ) : (
                            <BsImage style={{ color: 'var(--text-tertiary)', fontSize: '1.2rem' }} />
                        )}
                    </div>
                );
            }
        },
        { key: 'consumableCode', label: 'Mã vật tư', mono: true, width: 150 },
        { key: 'name', label: 'Tên vật tư' },
        { key: 'unitName', label: 'Đơn vị tính', width: 110 },
        {
            key: 'price',
            label: 'Đơn giá',
            width: 140,
            render: (val) => val != null ? `${Number(val).toLocaleString('vi-VN')} đ` : '—'
        },
        { key: 'manufacturer', label: 'Nhà sản xuất', width: 160 },
        {
            key: 'status',
            label: 'Trạng thái',
            width: 140,
            render: (val) => {
                const isAct = val === 'ACTIVE';
                return <StatusBadge status={isAct ? 'normal' : 'inactive'} label={isAct ? 'Hoạt động' : 'Ngừng dùng'} />;
            }
        }
    ], []);

    const columnsSparePart = useMemo(() => [
        {
            key: 'imgPath',
            label: 'Hình ảnh',
            sortable: false,
            width: 90,
            render: (val) => {
                const firstImg = val ? val.split('|').filter(Boolean)[0] : null;
                return (
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {firstImg ? (
                            <img src={firstImg} alt="vật tư" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '📷'; }} />
                        ) : (
                            <BsImage style={{ color: 'var(--text-tertiary)', fontSize: '1.2rem' }} />
                        )}
                    </div>
                );
            }
        },
        { key: 'sparePartCode', label: 'Mã vật tư', mono: true, width: 150 },
        { key: 'name', label: 'Tên vật tư' },
        { key: 'unitName', label: 'Đơn vị tính', width: 110 },
        {
            key: 'price',
            label: 'Đơn giá',
            width: 140,
            render: (val) => val != null ? `${Number(val).toLocaleString('vi-VN')} đ` : '—'
        },
        { key: 'manufacturer', label: 'Nhà sản xuất', width: 160 },
        {
            key: 'status',
            label: 'Trạng thái',
            width: 140,
            render: (val) => {
                const isAct = val === 'ACTIVE';
                return <StatusBadge status={isAct ? 'normal' : 'inactive'} label={isAct ? 'Hoạt động' : 'Ngừng dùng'} />;
            }
        }
    ], []);

    /* ============================================================
       5. XỬ LÝ SUBMIT FORM
       ============================================================ */
    const handleFormSubmit = async (values, { setSubmitting }) => {
        const payload = {
            name: values.name.trim(),
            price: Number(values.price),
            manufacturer: values.manufacturer ? values.manufacturer.trim() : null,
            imgPath: values.imgPath.trim(),
            unitId: parseInt(values.unitId, 10),
            status: values.status
        };

        if (activeTab === 'consumables') {
            payload.consumableCode = values.code.trim();
        } else {
            payload.sparePartCode = values.code.trim();
        }

        try {
            if (editingItem) {
                if (activeTab === 'consumables') {
                    await consumableService.update(editingItem.id, payload);
                    toast.success('Đã cập nhật vật tư tiêu hao thành công.');
                    fetchConsumables(consumableFilters);
                } else {
                    await sparePartService.update(editingItem.id, payload);
                    toast.success('Đã cập nhật vật tư thay thế thành công.');
                    fetchSpareParts(sparePartFilters);
                }
            } else {
                if (activeTab === 'consumables') {
                    await consumableService.create(payload);
                    toast.success('Thêm mới vật tư tiêu hao thành công.');
                    fetchConsumables(consumableFilters);
                } else {
                    await sparePartService.create(payload);
                    toast.success('Thêm mới vật tư thay thế thành công.');
                    fetchSpareParts(sparePartFilters);
                }
            }
            setShowFormModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Lỗi khi gửi form vật tư:', error);
            const errorMsg = error.response?.data?.message || 'Lỗi xử lý dữ liệu từ máy chủ.';
            toast.error(`Không thể lưu vật tư: ${errorMsg}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Danh mục Vật tư"
                subtitle="Quản lý danh sách vật tư tiêu hao và vật tư thay thế của nhà máy"
                icon={<BsBoxSeam />}
                actions={
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setEditingItem(null);
                            setShowFormModal(true);
                        }}
                    >
                        <BsPlusLg className="me-1" /> Thêm mới
                    </Button>
                }
            />

            {/* TABS CHUYỂN MODULE VẬT TƯ */}
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => {
                    setActiveTab(k);
                    setEditingItem(null);
                }}
                className="mb-4 scms-tabs"
            >
                {/* TAB: VẬT TƯ TIÊU HAO */}
                <Tab eventKey="consumables" title="Vật tư tiêu hao (Consumable)">
                    {/* SEARCH FORM VẬT TƯ TIÊU HAO */}
                    <ConsumableSearchForm
                        filters={consumableFilters}
                        onChange={(e) => handleFilterChange(e, 'consumable')}
                        onSearch={(e) => handleApplyFilter(e, 'consumable')}
                        onReset={() => handleResetFilter('consumable')}
                    />

                    {/* TABLE VẬT TƯ TIÊU HAO */}
                    <DataTable
                        columns={columnsConsumable}
                        data={consumablesList}
                        loading={isLoading}
                        searchable={true}
                        searchPlaceholder="Tìm nhanh trong danh sách..."
                        pageSize={8}
                        onView={(row) => {
                            setViewingItem(row);
                            setShowViewModal(true);
                        }}
                        onEdit={(row) => {
                            setEditingItem(row);
                            setShowFormModal(true);
                        }}
                        onDelete={triggerDelete}
                    />
                </Tab>

                {/* TAB: VẬT TƯ THAY THẾ */}
                <Tab eventKey="spareparts" title="Vật tư thay thế (Spare Part)">
                    {/* SEARCH FORM VẬT TƯ THAY THẾ */}
                    <SparePartSearchForm
                        filters={sparePartFilters}
                        onChange={(e) => handleFilterChange(e, 'sparepart')}
                        onSearch={(e) => handleApplyFilter(e, 'sparepart')}
                        onReset={() => handleResetFilter('sparepart')}
                    />

                    {/* TABLE VẬT TƯ THAY THẾ */}
                    <DataTable
                        columns={columnsSparePart}
                        data={sparePartsList}
                        loading={isLoading}
                        searchable={true}
                        searchPlaceholder="Tìm nhanh trong danh sách..."
                        pageSize={8}
                        onView={(row) => {
                            setViewingItem(row);
                            setShowViewModal(true);
                        }}
                        onEdit={(row) => {
                            setEditingItem(row);
                            setShowFormModal(true);
                        }}
                        onDelete={triggerDelete}
                    />
                </Tab>
            </Tabs>

            {/* MODALS THÊM MỚI / CẬP NHẬT */}
            {activeTab === 'consumables' ? (
                <ConsumableFormModal
                    show={showFormModal}
                    onHide={() => { setShowFormModal(false); setEditingItem(null); }}
                    editingItem={editingItem}
                    onSubmit={handleFormSubmit}
                />
            ) : (
                <SparePartFormModal
                    show={showFormModal}
                    onHide={() => { setShowFormModal(false); setEditingItem(null); }}
                    editingItem={editingItem}
                    onSubmit={handleFormSubmit}
                />
            )}

            <MaterialDetailModal
                show={showViewModal}
                onHide={() => { setShowViewModal(false); setViewingItem(null); }}
                item={viewingItem}
                type={activeTab}
            />

            {/* CONFIRM DELETE MODAL */}
            <ConfirmModal
                show={showDeleteModal}
                title="Xác nhận xoá vật tư"
                message={`Bạn có chắc chắn muốn xoá vật tư "${deletingItem?.name}" khỏi danh mục? Hành động này sẽ xoá mềm dữ liệu.`}
                confirmText="Đồng ý xoá"
                cancelText="Bỏ qua"
                loading={deletingLoading}
                onClose={() => { setShowDeleteModal(false); setDeletingItem(null); }}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
