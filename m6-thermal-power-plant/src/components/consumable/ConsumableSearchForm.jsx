import { Row, Col, Button, Form as BootstrapForm } from 'react-bootstrap';
import { BsArrowClockwise, BsSearch } from 'react-icons/bs';

export default function ConsumableSearchForm({ filters, onChange, onSearch, onReset }) {
    return (
        <div className="surface-card p-4 mb-4">
            <BootstrapForm onSubmit={onSearch}>
                <Row className="g-3">
                    <Col md={3}>
                        <label className="form-label">Mã vật tư</label>
                        <input
                            type="text"
                            name="code"
                            className="form-control"
                            placeholder="VD: CON-RP7..."
                            value={filters.code}
                            onChange={onChange}
                        />
                    </Col>
                    <Col md={3}>
                        <label className="form-label">Tên vật tư</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="VD: Dầu mỡ, giẻ lau..."
                            value={filters.name}
                            onChange={onChange}
                        />
                    </Col>
                    <Col md={3}>
                        <label className="form-label">Nhà sản xuất</label>
                        <input
                            type="text"
                            name="manufacturer"
                            className="form-control"
                            placeholder="VD: Shell, Mobil..."
                            value={filters.manufacturer}
                            onChange={onChange}
                        />
                    </Col>
                    <Col md={3}>
                        <label className="form-label">Trạng thái</label>
                        <select
                            name="status"
                            className="form-select"
                            value={filters.status}
                            onChange={onChange}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                            <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
                        </select>
                    </Col>
                    <Col xs={12} className="d-flex justify-content-end gap-2 mt-3">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            type="button"
                            onClick={onReset}
                        >
                            <BsArrowClockwise className="me-1" /> Thiết lập lại
                        </Button>
                        <Button variant="primary" size="sm" type="submit">
                            <BsSearch className="me-1" /> Tìm kiếm
                        </Button>
                    </Col>
                </Row>
            </BootstrapForm>
        </div>
    );
}
