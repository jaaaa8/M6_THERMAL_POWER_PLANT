import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, Tab, Button, Form as BootstrapForm, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { BsBoxSeam, BsPlusLg, BsSearch, BsArrowClockwise, BsImage, BsTags, BsCashCoin, BsExclamationTriangle } from 'react-icons/bs';

import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConsumableImportModal from '../components/consumable/ConsumableImportModal';
import SparePartImportModal from '../components/spare_part/SparePartImportModal';
import * as consumableInventoryService from '../services/consumableInventoryService';
import * as sparePartInventoryService from '../services/sparePartInventoryService';

export default function MaterialInventoryPage({ type = 'consumables' }) {
    const materialType = type;
    const [activeTab, setActiveTab] = useState('stock');
    const [isLoading, setIsLoading] = useState(false);

    // States danh sách
    const [stockList, setStockList] = useState([]);
    const [receiptHistory, setReceiptHistory] = useState([]);

    // Filters tìm kiếm tồn kho
    const [filters, setFilters] = useState({
        code: '',
        name: '',
        manufacturer: '',
        status: 'ACTIVE'
    });

    // Modal nhập kho
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Tải dữ liệu tồn kho hiện tại
    const fetchStock = useCallback(async (searchParams, currentMaterialType) => {
        setIsLoading(true);
        try {
            const params = {
                code: searchParams?.code?.trim() || undefined,
                name: searchParams?.name?.trim() || undefined,
                manufacturer: searchParams?.manufacturer?.trim() || undefined,
                status: searchParams?.status || undefined,
                page: 0,
                size: 100
            };
            const service = currentMaterialType === 'consumables' ? consumableInventoryService : sparePartInventoryService;
            const response = await service.getStockList(params);
            setStockList(response.data.content || []);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu tồn kho:', error);
            toast.error('Không thể kết nối API tải tồn kho.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Tải lịch sử nhập kho
    const fetchReceiptHistory = useCallback(async (currentMaterialType) => {
        setIsLoading(true);
        try {
            const params = { page: 0, size: 100, sort: 'id,desc' };
            const service = currentMaterialType === 'consumables' ? consumableInventoryService : sparePartInventoryService;
            const response = await service.getReceiptHistory(params);
            setReceiptHistory(response.data.content || []);
        } catch (error) {
            console.error('Lỗi tải lịch sử nhập kho:', error);
            toast.error('Không thể kết nối API tải lịch sử nhập kho.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'stock') {
            fetchStock(filters, materialType);
        } else {
            fetchReceiptHistory(materialType);
        }
    }, [activeTab, materialType, fetchStock, fetchReceiptHistory]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilter = (e) => {
        e.preventDefault();
        fetchStock(filters, materialType);
    };

    const handleResetFilter = () => {
        const defaults = { code: '', name: '', manufacturer: '', status: 'ACTIVE' };
        setFilters(defaults);
        fetchStock(defaults, materialType);
    };

    const handleOpenImportModal = (item) => {
        setSelectedItem(item);
        setShowImportModal(true);
    };

    const handleImportSubmit = async (payload, { setSubmitting, resetForm }) => {
        try {
            const service = materialType === 'consumables' ? consumableInventoryService : sparePartInventoryService;
            if (materialType === 'consumables') {
                await service.importConsumable(payload);
                toast.success('Nhập kho vật tư tiêu hao thành công.');
            } else {
                await service.importSparePart(payload);
                toast.success('Nhập kho vật tư thay thế thành công.');
            }
            setShowImportModal(false);
            setSelectedItem(null);
            resetForm();
            fetchStock(filters, materialType);
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu nhập kho:', error);
            const msg = error.response?.data?.message || error.message || 'Không thể lưu phiếu nhập kho.';
            toast.error(`Nhập kho thất bại: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Cột hiển thị bảng tồn kho
    const stockColumns = useMemo(() => [
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
        { key: materialType === 'consumables' ? 'consumableCode' : 'sparePartCode', label: 'Mã vật tư', mono: true, width: 140 },
        { key: 'name', label: 'Tên vật tư' },
        { key: 'unitName', label: 'Đơn vị tính', width: 110 },
        {
            key: 'currentStock',
            label: 'Tồn kho khả dụng',
            width: 160,
            render: (val) => (
                <span className={`fw-bold ${val <= 5 ? 'text-danger' : 'text-success'}`}>
                    {val != null ? val.toLocaleString('vi-VN') : 0}
                </span>
            )
        },
        { key: 'manufacturer', label: 'Nhà sản xuất', width: 160 },
        {
            key: 'status',
            label: 'Trạng thái',
            width: 140,
            render: (val) => {
                const isAct = val === 'ACTIVE';
                return <StatusBadge status={isAct ? 'normal' : 'inactive'} label={isAct ? 'Còn dùng' : 'Ngừng dùng'} />;
            }
        }
    ], [materialType]);

    // Cột hiển thị bảng lịch sử nhập kho
    const receiptColumns = useMemo(() => [
        { key: 'receiptCode', label: 'Số phiếu nhập', mono: true, width: 150 },
        { key: materialType === 'consumables' ? 'consumableCode' : 'sparePartCode', label: 'Mã vật tư', mono: true, width: 140 },
        { key: materialType === 'consumables' ? 'consumableName' : 'sparePartName', label: 'Tên vật tư' },
        {
            key: 'quantity',
            label: 'Số lượng nhập',
            width: 130,
            render: (val, row) => `${val.toLocaleString('vi-VN')} ${row.unitName || ''}`
        },
        { key: 'supplier', label: 'Nhà cung cấp', width: 180 },
        { key: 'receivedByUsername', label: 'Người thực hiện', width: 150 },
        {
            key: 'receivedAt',
            label: 'Thời gian nhập',
            width: 180,
            render: (val) => new Date(val).toLocaleString('vi-VN')
        }
    ], [materialType]);

    // Phân tích thống kê tổng quan
    const stats = useMemo(() => {
        const totalCategories = stockList.length;
        let totalStockQuantity = 0;
        let totalValue = 0;
        let lowStockCount = 0;

        stockList.forEach(item => {
            const stock = item.currentStock || 0;
            const price = item.price || 0;
            
            totalStockQuantity += stock;
            totalValue += (stock * price);
            
            if (stock <= 5) {
                lowStockCount++;
            }
        });

        return {
            totalCategories,
            totalStockQuantity,
            totalValue,
            lowStockCount
        };
    }, [stockList]);

    return (
        <div className="animate-fade-in">
            <PageHeader
                title={materialType === 'consumables' ? "Nhập / Xuất Tiêu hao" : "Nhập / Xuất Thay thế"}
                subtitle={materialType === 'consumables' ? "Quản lý tồn kho vật tư tiêu hao và lập chứng từ nhập kho" : "Quản lý tồn kho vật tư thay thế và lập chứng từ nhập kho"}
                icon={<BsBoxSeam />}
            />

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4 scms-tabs"
            >
                <Tab eventKey="stock" title="Tồn kho hiện tại">
                    {/* THẺ CHỈ SỐ TỔNG QUAN — style đồng bộ với trang CCDC (.ccdc-stat) */}
                    <Row className="g-3 mb-4">
                        {[
                            { key: 'categories', label: 'Chủng loại vật tư', value: stats.totalCategories, icon: <BsTags />, color: 'var(--color-primary)' },
                            { key: 'total', label: 'Tổng lượng tồn kho', value: stats.totalStockQuantity, icon: <BsBoxSeam />, color: 'var(--color-status-info)' },
                            { key: 'low', label: 'Vật tư sắp hết (Tồn ≤ 5)', value: stats.lowStockCount, icon: <BsExclamationTriangle />, color: stats.lowStockCount > 0 ? 'var(--color-status-danger)' : 'var(--color-status-inactive)' },
                        ].map((s) => (
                            <Col xs={12} md={4} key={s.key}>
                                <div className="ccdc-stat surface-card">
                                    <span className="ccdc-stat-icon" style={{ color: s.color }}>{s.icon}</span>
                                    <div className="ccdc-stat-body">
                                        <span className="ccdc-stat-value">{s.value.toLocaleString('vi-VN')}</span>
                                        <span className="ccdc-stat-label">{s.label}</span>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    {/* Tìm kiếm tồn kho */}
                    <div className="surface-card p-4 mb-4">
                        <BootstrapForm onSubmit={handleApplyFilter}>
                            <Row className="g-3">
                                <Col md={3}>
                                    <label className="form-label">Mã vật tư</label>
                                    <input
                                        type="text"
                                        name="code"
                                        className="form-control"
                                        placeholder="Mã KKS/Vật tư..."
                                        value={filters.code}
                                        onChange={handleFilterChange}
                                    />
                                </Col>
                                <Col md={3}>
                                    <label className="form-label">Tên vật tư</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        placeholder="Tên danh mục..."
                                        value={filters.name}
                                        onChange={handleFilterChange}
                                    />
                                </Col>
                                <Col md={3}>
                                    <label className="form-label">Nhà sản xuất</label>
                                    <input
                                        type="text"
                                        name="manufacturer"
                                        className="form-control"
                                        placeholder="Hãng sản xuất..."
                                        value={filters.manufacturer}
                                        onChange={handleFilterChange}
                                    />
                                </Col>
                                <Col md={3}>
                                    <label className="form-label">Trạng thái danh mục</label>
                                    <select
                                        name="status"
                                        className="form-select"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                                        <option value="INACTIVE">Ngừng dùng (INACTIVE)</option>
                                    </select>
                                </Col>
                                <Col xs={12} className="d-flex justify-content-end gap-2 mt-3">
                                    <Button variant="outline-secondary" size="sm" type="button" onClick={handleResetFilter}>
                                        <BsArrowClockwise className="me-1" /> Thiết lập lại
                                    </Button>
                                    <Button variant="primary" size="sm" type="submit">
                                        <BsSearch className="me-1" /> Tìm kiếm
                                    </Button>
                                </Col>
                            </Row>
                        </BootstrapForm>
                    </div>

                    {/* Bảng tồn kho */}
                    <DataTable
                        columns={stockColumns}
                        data={stockList}
                        loading={isLoading}
                        searchable={true}
                        searchPlaceholder="Lọc nhanh danh mục..."
                        pageSize={8}
                        renderActions={(row) => (
                            <div className="data-table-actions">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    disabled={row.status !== 'ACTIVE'}
                                    onClick={() => handleOpenImportModal(row)}
                                >
                                    Nhập kho
                                </Button>
                            </div>
                        )}
                    />
                </Tab>

                <Tab eventKey="history" title="Lịch sử nhập kho">
                    <DataTable
                        columns={receiptColumns}
                        data={receiptHistory}
                        loading={isLoading}
                        searchable={true}
                        searchPlaceholder="Lọc nhanh lịch sử..."
                        pageSize={10}
                    />
                </Tab>
            </Tabs>

            {/* Modal Nhập kho */}
            {materialType === 'consumables' ? (
                <ConsumableImportModal
                    show={showImportModal}
                    onHide={() => { setShowImportModal(false); setSelectedItem(null); }}
                    consumableItem={selectedItem}
                    onSubmit={handleImportSubmit}
                />
            ) : (
                <SparePartImportModal
                    show={showImportModal}
                    onHide={() => { setShowImportModal(false); setSelectedItem(null); }}
                    sparePartItem={selectedItem}
                    onSubmit={handleImportSubmit}
                />
            )}
        </div>
    );
}
