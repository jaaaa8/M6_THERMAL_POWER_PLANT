import {useState, useEffect, useMemo} from "react";
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { BsEye, BsInfoCircle, BsImage } from 'react-icons/bs';

export default function MaterialDetailModal({ show, onHide, item, type }) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showZoom, setShowZoom] = useState(false);

    // Reset active image index khi item thay đổi hoặc mở modal
    useEffect(() => {
        if (show) {
            setActiveImageIndex(0);
            setShowZoom(false);
        }
    }, [show, item]);

    const images = useMemo(() => {
        if (!item || !item.imgPath) return [];
        return item.imgPath.split('|').filter(Boolean);
    }, [item]);

    if (!item) return null;

    const isConsumable = type === 'consumables';
    const code = isConsumable ? item.consumableCode : item.sparePartCode;
    const isAct = item.status === 'ACTIVE';

    return (
        <>
            <Modal show={show} onHide={onHide} centered size="lg" className="material-detail-modal">
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
                        <BsEye className="me-2" style={{ color: 'var(--color-primary)' }} />
                        Chi tiết {isConsumable ? 'vật tư tiêu hao' : 'vật tư thay thế'}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Row>
                        {/* HÀNH LANG ẢNH (LEFT) */}
                        <Col md={5} className="d-flex flex-column align-items-center mb-3 mb-md-0">
                            {images.length > 0 ? (
                                <>
                                    {/* Ảnh phóng to */}
                                    <div 
                                        className="border rounded p-2 d-flex align-items-center justify-content-center bg-white mb-2" 
                                        style={{ width: '100%', height: '260px', overflow: 'hidden', cursor: 'zoom-in' }}
                                        onClick={() => setShowZoom(true)}
                                        title="Click để xem ảnh đầy màn hình"
                                    >
                                        <img
                                            src={images[activeImageIndex]}
                                            alt={item.name}
                                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                                        />
                                    </div>
                                    
                                    {/* Thumbnail ảnh bên dưới */}
                                    {images.length > 1 && (
                                        <div className="d-flex gap-2 w-100 justify-content-center overflow-auto py-1">
                                            {images.map((img, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`border rounded p-1 cursor-pointer bg-white ${activeImageIndex === idx ? 'border-primary' : ''}`}
                                                    style={{ width: '60px', height: '60px', overflow: 'hidden', borderWidth: activeImageIndex === idx ? '2px' : '1px' }}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                >
                                                    <img 
                                                        src={img} 
                                                        alt={`Thumbnail ${idx + 1}`} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div 
                                    className="border rounded d-flex flex-column align-items-center justify-content-center bg-light text-muted w-100" 
                                    style={{ height: '260px' }}
                                >
                                    <BsImage style={{ fontSize: '3rem' }} className="mb-2 text-secondary" />
                                    <div>Chưa có ảnh minh họa</div>
                                </div>
                            )}
                        </Col>

                        {/* THÔNG TIN CHI TIẾT (RIGHT) */}
                        <Col md={7}>
                            <div className="table-responsive">
                                <table className="table table-bordered table-striped align-middle mb-0" style={{ fontSize: 'var(--text-sm)' }}>
                                    <tbody>
                                        <tr>
                                            <th style={{ width: '35%', backgroundColor: 'var(--color-surface-container)' }}>Mã vật tư</th>
                                            <td className="font-mono fw-semibold">{code || '—'}</td>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: 'var(--color-surface-container)' }}>Tên vật tư</th>
                                            <td>{item.name || '—'}</td>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: 'var(--color-surface-container)' }}>Đơn giá</th>
                                            <td className="fw-semibold text-primary">
                                                {item.price != null ? `${Number(item.price).toLocaleString('vi-VN')} đ` : '—'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: 'var(--color-surface-container)' }}>Đơn vị tính</th>
                                            <td>{item.unitName || '—'}</td>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: 'var(--color-surface-container)' }}>Nhà sản xuất</th>
                                            <td>{item.manufacturer || '—'}</td>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: 'var(--color-surface-container)' }}>Trạng thái</th>
                                            <td>
                                                <Badge bg={isAct ? 'success' : 'danger'}>
                                                    {isAct ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" size="sm" type="button" onClick={onHide}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Zoom Ảnh Full Màn Hình */}
            <Modal 
                show={showZoom} 
                onHide={() => setShowZoom(false)} 
                centered 
                size="xl" 
                contentClassName="bg-transparent border-0 shadow-none"
            >
                <Modal.Body 
                    className="p-0 position-relative d-flex justify-content-center align-items-center" 
                    onClick={() => setShowZoom(false)} 
                    style={{ outline: 'none' }}
                >
                    <img 
                        src={images[activeImageIndex]} 
                        alt="Zoomed" 
                        style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', cursor: 'zoom-out', borderRadius: '4px' }}
                    />
                    <button 
                        type="button" 
                        className="btn-close btn-close-white position-absolute" 
                        style={{ top: '15px', right: '15px', fontSize: '1.5rem', zIndex: 1050, opacity: 0.8 }}
                        onClick={() => setShowZoom(false)}
                    />
                </Modal.Body>
            </Modal>
        </>
    );
}
