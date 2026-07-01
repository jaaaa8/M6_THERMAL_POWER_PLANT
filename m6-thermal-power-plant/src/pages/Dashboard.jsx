import { useNavigate } from 'react-router-dom';
import { Row, Col, Card } from 'react-bootstrap';
import {
  BsGrid1X2, BsCpu, BsWrenchAdjustable, BsExclamationTriangle,
  BsFileEarmarkText, BsBoxSeam, BsTools, BsDropletHalf,
  BsArrowUpRight, BsArrowDownRight, BsPersonPlusFill
} from 'react-icons/bs';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import './Dashboard.css';

/* --- Mock data --- */
const stats = [
  { label: 'Thiết bị', value: 247, icon: <BsCpu />, color: 'var(--color-primary-500)', trend: '+3', up: true },
  { label: 'Đang sửa chữa', value: 12, icon: <BsWrenchAdjustable />, color: 'var(--color-status-info)', trend: '+2', up: true },
  { label: 'Yêu cầu chờ', value: 5, icon: <BsExclamationTriangle />, color: 'var(--color-status-warning)', trend: '-1', up: false },
  { label: 'Sự cố khẩn', value: 2, icon: <BsExclamationTriangle />, color: 'var(--color-status-danger)', trend: '+1', up: true },
];

const recentRequests = [
  { id: 1, maPhieu: 'YC-2026-0045', thietBi: 'Bơm cấp nước thô', kksCode: 'ABC002M1', mucDo: 'warning', status: 'Chờ xử lý', ngay: '19/06/2026' },
  { id: 2, maPhieu: 'YC-2026-0044', thietBi: 'Động cơ bơm nước thải', kksCode: 'DEF005E2', mucDo: 'danger', status: 'Đang sửa', ngay: '18/06/2026' },
  { id: 3, maPhieu: 'YC-2026-0043', thietBi: 'Van điều khiển áp suất', kksCode: 'GHI010V3', mucDo: 'normal', status: 'Hoàn thành', ngay: '17/06/2026' },
  { id: 4, maPhieu: 'YC-2026-0042', thietBi: 'Đồng hồ đo áp suất', kksCode: 'ABC002I1', mucDo: 'warning', status: 'Chờ xử lý', ngay: '17/06/2026' },
  { id: 5, maPhieu: 'YC-2026-0041', thietBi: 'Máy nén khí chính', kksCode: 'JKL003M5', mucDo: 'danger', status: 'Đang sửa', ngay: '16/06/2026' },
];

const requestColumns = [
  { key: 'maPhieu', label: 'Mã phiếu', mono: true },
  { key: 'thietBi', label: 'Thiết bị' },
  { key: 'kksCode', label: 'Mã KKS', mono: true },
  {
    key: 'mucDo', label: 'Mức độ',
    render: (val) => {
      const labels = { warning: 'Cảnh báo', danger: 'Khẩn cấp', normal: 'Bình thường' };
      return <StatusBadge status={val} label={labels[val]} pulse={val === 'danger'} />;
    },
  },
  { key: 'ngay', label: 'Ngày tạo' },
];

const equipmentStatus = [
  { label: 'Đang vận hành', count: 218, status: 'normal' },
  { label: 'Đang sửa chữa', count: 12, status: 'info' },
  { label: 'Đang dự phòng', count: 15, status: 'inactive' },
  { label: 'Sự cố', count: 2, status: 'danger' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan tình trạng vận hành nhà máy"
        icon={<BsGrid1X2 />}
      />

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {stats.map((stat, i) => (
          <Col key={i} xs={6} lg={3}>
            <div className="stat-card surface-card">
              <div className="stat-card-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-card-body">
                <span className="stat-card-value">{stat.value}</span>
                <span className="stat-card-label">{stat.label}</span>
              </div>
              <span className={`stat-card-trend ${stat.up ? 'up' : 'down'}`}>
                {stat.up ? <BsArrowUpRight /> : <BsArrowDownRight />}
                {stat.trend}
              </span>
            </div>
          </Col>
        ))}
      </Row>

      <Row className="g-3">
        {/* Recent repair requests */}
        <Col lg={8}>
          <Card className="mb-3">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <span><BsFileEarmarkText className="me-2" />Yêu cầu sửa chữa gần đây</span>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable
                columns={requestColumns}
                data={recentRequests}
                searchable={false}
                pageSize={5}
                onView={(row) => console.log('View:', row)}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Equipment status summary */}
        <Col lg={4}>
          <Card>
            <Card.Header>
              <BsCpu className="me-2" />Trạng thái Thiết bị
            </Card.Header>
            <Card.Body>
              <div className="equipment-status-list">
                {equipmentStatus.map((item, i) => (
                  <div key={i} className="equipment-status-item">
                    <StatusBadge status={item.status} label={item.label} />
                    <span className="equipment-status-count">{item.count}</span>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div className="equipment-bar-chart">
                {equipmentStatus.map((item, i) => (
                  <div
                    key={i}
                    className={`equipment-bar bar-${item.status}`}
                    style={{ width: `${(item.count / 247) * 100}%` }}
                    title={`${item.label}: ${item.count}`}
                  />
                ))}
              </div>

              <div className="text-center mt-3">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  Tổng: <strong>247</strong> thiết bị
                </span>
              </div>
            </Card.Body>
          </Card>

          {/* Quick actions */}
          <Card className="mt-3">
            <Card.Header>
              <BsTools className="me-2" />Truy cập nhanh
            </Card.Header>
            <Card.Body className="quick-actions">
              <button className="quick-action-btn">
                <BsExclamationTriangle className="qa-icon" style={{ color: 'var(--color-status-warning)' }} />
                <span>Tạo yêu cầu<br />sửa chữa</span>
              </button>
              <button className="quick-action-btn">
                <BsFileEarmarkText className="qa-icon" style={{ color: 'var(--color-primary-500)' }} />
                <span>Lập phiếu<br />công tác</span>
              </button>
              <button className="quick-action-btn">
                <BsBoxSeam className="qa-icon" style={{ color: 'var(--color-status-info)' }} />
                <span>Nhập kho<br />vật tư</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/maintenance/plans')}>
                <BsDropletHalf className="qa-icon" style={{ color: 'var(--color-status-normal)' }} />
                <span>Lịch bảo<br />dưỡng</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/hr/employees/new')}>
                <BsPersonPlusFill className="qa-icon" style={{ color: 'var(--color-accent)' }} />
                <span>Thêm mới<br />nhân sự</span>
              </button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
