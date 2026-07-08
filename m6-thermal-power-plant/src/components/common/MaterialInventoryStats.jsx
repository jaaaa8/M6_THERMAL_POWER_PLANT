import { useMemo } from 'react';
import { Row, Col, Card, Table, ProgressBar, Button } from 'react-bootstrap';
import { 
    BsBoxSeam, 
    BsExclamationTriangle, 
    BsCashCoin, 
    BsTags, 
    BsBuilding, 
    BsCheckCircle, 
    BsXCircle,
    BsPlusLg 
} from 'react-icons/bs';

export default function MaterialInventoryStats({ stockList = [], materialType, onImport }) {
    // 1. Phân tích thống kê tổng quan
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

    // 2. Danh sách vật tư tồn kho thấp (Low stock <= 5)
    const lowStockItems = useMemo(() => {
        return stockList
            .filter(item => (item.currentStock || 0) <= 5)
            .sort((a, b) => (a.currentStock || 0) - (b.currentStock || 0));
    }, [stockList]);

    // 3. Cơ cấu tồn kho theo Hãng sản xuất
    const manufacturerStats = useMemo(() => {
        const groups = {};
        let grandTotalStock = 0;

        stockList.forEach(item => {
            const manufacturer = (item.manufacturer || 'Chưa rõ').trim();
            const stock = item.currentStock || 0;
            grandTotalStock += stock;

            if (!groups[manufacturer]) {
                groups[manufacturer] = {
                    name: manufacturer,
                    categoriesCount: 0,
                    totalStock: 0
                };
            }
            groups[manufacturer].categoriesCount += 1;
            groups[manufacturer].totalStock += stock;
        });

        return Object.values(groups)
            .map(g => ({
                ...g,
                percentage: grandTotalStock > 0 ? Math.round((g.totalStock / grandTotalStock) * 100) : 0
            }))
            .sort((a, b) => b.totalStock - a.totalStock)
            .slice(0, 5); // Lấy Top 5 hãng sản xuất
    }, [stockList]);

    // 4. Cơ cấu tồn kho theo Trạng thái (Còn dùng / Ngừng dùng)
    const statusStats = useMemo(() => {
        let activeCount = 0;
        let inactiveCount = 0;
        let activeStock = 0;
        let inactiveStock = 0;

        stockList.forEach(item => {
            const stock = item.currentStock || 0;
            if (item.status === 'ACTIVE') {
                activeCount++;
                activeStock += stock;
            } else {
                inactiveCount++;
                inactiveStock += stock;
            }
        });

        const totalStock = activeStock + inactiveStock;

        return {
            activeCount,
            inactiveCount,
            activeStock,
            inactiveStock,
            activePercent: totalStock > 0 ? Math.round((activeStock / totalStock) * 100) : 0,
            inactivePercent: totalStock > 0 ? Math.round((inactiveStock / totalStock) * 100) : 0,
        };
    }, [stockList]);

    const codeKey = materialType === 'consumables' ? 'consumableCode' : 'sparePartCode';

    return (
        <div className="inventory-stats-dashboard">
            {/* THẺ CHỈ SỐ TỔNG QUAN */}
            <Row className="g-3 mb-4">
                <Col xs={12} sm={6} lg={3}>
                    <div className="stat-card surface-card p-3 d-flex align-items-center">
                        <div className="stat-card-icon me-3 d-flex align-items-center justify-content-center" 
                             style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-50)', color: 'var(--color-primary-500)', fontSize: '1.4rem' }}>
                            <BsTags />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Chủng loại vật tư</div>
                            <div className="fw-bold" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                                {stats.totalCategories.toLocaleString('vi-VN')}
                            </div>
                        </div>
                    </div>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                    <div className="stat-card surface-card p-3 d-flex align-items-center">
                        <div className="stat-card-icon me-3 d-flex align-items-center justify-content-center" 
                             style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--color-status-info-bg)', color: 'var(--color-status-info)', fontSize: '1.4rem' }}>
                            <BsBoxSeam />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Tổng lượng tồn kho</div>
                            <div className="fw-bold" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                                {stats.totalStockQuantity.toLocaleString('vi-VN')}
                            </div>
                        </div>
                    </div>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                    <div className="stat-card surface-card p-3 d-flex align-items-center">
                        <div className="stat-card-icon me-3 d-flex align-items-center justify-content-center" 
                             style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--color-status-normal-bg)', color: 'var(--color-status-normal)', fontSize: '1.4rem' }}>
                            <BsCashCoin />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Tổng giá trị tồn kho</div>
                            <div className="fw-bold" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                                {stats.totalValue.toLocaleString('vi-VN')} đ
                            </div>
                        </div>
                    </div>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                    <div className={`stat-card surface-card p-3 d-flex align-items-center ${stats.lowStockCount > 0 ? 'border-danger' : ''}`}
                         style={{ transition: 'all 0.3s ease' }}>
                        <div className="stat-card-icon me-3 d-flex align-items-center justify-content-center" 
                             style={{ 
                                 width: '48px', 
                                 height: '48px', 
                                 borderRadius: 'var(--radius-lg)', 
                                 background: stats.lowStockCount > 0 ? 'var(--color-status-danger-bg)' : 'var(--color-status-inactive-bg)', 
                                 color: stats.lowStockCount > 0 ? 'var(--color-status-danger)' : 'var(--color-status-inactive)', 
                                 fontSize: '1.4rem' 
                             }}>
                            <BsExclamationTriangle />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Vật tư sắp hết (Tồn ≤ 5)</div>
                            <div className={`fw-bold ${stats.lowStockCount > 0 ? 'text-danger' : ''}`} style={{ fontSize: 'var(--text-xl)' }}>
                                {stats.lowStockCount.toLocaleString('vi-VN')}
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* BẢNG CHI TIẾT VÀ PHÂN TÍCH */}
            <Row className="g-4">
                {/* 1. BẢNG CẢNH BÁO TỒN KHO THẤP */}
                <Col lg={8}>
                    <Card style={{ height: '100%' }}>
                        <Card.Header className="d-flex align-items-center justify-content-between" style={{ background: 'transparent' }}>
                            <span className="fw-semibold d-flex align-items-center gap-2">
                                <BsExclamationTriangle className="text-danger" /> 
                                Cảnh báo tồn kho thấp (Tồn ≤ 5)
                            </span>
                            <span className="badge bg-danger rounded-pill">{lowStockItems.length} mặt hàng</span>
                        </Card.Header>
                        <Card.Body className="p-0" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            {lowStockItems.length === 0 ? (
                                <div className="text-center p-5 text-muted">
                                    <BsCheckCircle className="text-success mb-2" style={{ fontSize: '2rem' }} />
                                    <p className="mb-0">Tất cả vật tư đều có lượng tồn kho an toàn.</p>
                                </div>
                            ) : (
                                <Table hover responsive className="mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th>Mã vật tư</th>
                                            <th>Tên vật tư</th>
                                            <th>Nhà sản xuất</th>
                                            <th className="text-end">Tồn hiện tại</th>
                                            <th className="text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockItems.map(item => (
                                            <tr key={item.id}>
                                                <td className="font-mono fw-semibold text-primary">{item[codeKey]}</td>
                                                <td>
                                                    <div className="fw-medium">{item.name}</div>
                                                    <small className="text-muted">{item.unitName}</small>
                                                </td>
                                                <td>{item.manufacturer || '-'}</td>
                                                <td className="text-end">
                                                    <span className={`fw-bold ${item.currentStock === 0 ? 'text-danger' : 'text-warning'}`} style={{ fontSize: '1rem' }}>
                                                        {item.currentStock}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm" 
                                                        disabled={item.status !== 'ACTIVE'}
                                                        className="d-inline-flex align-items-center gap-1"
                                                        onClick={() => onImport(item)}
                                                    >
                                                        <BsPlusLg style={{ fontSize: '0.75rem' }} /> Nhập kho
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* 2. CƠ CẤU VÀ TỶ TRỌNG KHO */}
                <Col lg={4}>
                    {/* Cơ cấu theo hãng sản xuất */}
                    <Card className="mb-4">
                        <Card.Header className="fw-semibold d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
                            <BsBuilding className="text-primary" /> Top 5 Nhà Sản Xuất (Theo tồn kho)
                        </Card.Header>
                        <Card.Body>
                            {manufacturerStats.length === 0 ? (
                                <p className="text-center text-muted py-3 mb-0">Chưa có dữ liệu nhà sản xuất.</p>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {manufacturerStats.map((item, index) => (
                                        <div key={index}>
                                            <div className="d-flex justify-content-between mb-1" style={{ fontSize: 'var(--text-sm)' }}>
                                                <span className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>
                                                    {index + 1}. {item.name}
                                                </span>
                                                <span className="text-muted">
                                                    <strong>{item.totalStock.toLocaleString('vi-VN')}</strong> ({item.percentage}%)
                                                </span>
                                            </div>
                                            <ProgressBar 
                                                now={item.percentage} 
                                                variant={index === 0 ? 'primary' : index === 1 ? 'info' : 'secondary'} 
                                                style={{ height: '6px' }} 
                                            />
                                            <div className="text-end" style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                                {item.categoriesCount} chủng loại
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Cơ cấu trạng thái sử dụng */}
                    <Card>
                        <Card.Header className="fw-semibold" style={{ background: 'transparent' }}>
                            Trạng thái Danh mục Vật tư
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="fw-medium d-flex align-items-center gap-1" style={{ fontSize: 'var(--text-sm)' }}>
                                        <span className="d-inline-block" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-status-normal)' }}></span>
                                        Còn sử dụng (ACTIVE)
                                    </div>
                                    <small className="text-muted">{statusStats.activeCount} chủng loại</small>
                                </div>
                                <span className="fw-bold">{statusStats.activeStock.toLocaleString('vi-VN')} chiếc</span>
                            </div>

                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="fw-medium d-flex align-items-center gap-1" style={{ fontSize: 'var(--text-sm)' }}>
                                        <span className="d-inline-block" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-status-inactive)' }}></span>
                                        Ngừng sử dụng (INACTIVE)
                                    </div>
                                    <small className="text-muted">{statusStats.inactiveCount} chủng loại</small>
                                </div>
                                <span className="fw-bold">{statusStats.inactiveStock.toLocaleString('vi-VN')} chiếc</span>
                            </div>

                            <ProgressBar style={{ height: '10px' }}>
                                <ProgressBar 
                                    striped 
                                    variant="success" 
                                    now={statusStats.activePercent} 
                                    key={1} 
                                    label={statusStats.activePercent > 10 ? `${statusStats.activePercent}%` : ''} 
                                />
                                <ProgressBar 
                                    variant="secondary" 
                                    now={statusStats.inactivePercent} 
                                    key={2} 
                                    label={statusStats.inactivePercent > 10 ? `${statusStats.inactivePercent}%` : ''} 
                                />
                            </ProgressBar>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
