import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card } from 'react-bootstrap';
import {
  BsGrid1X2, BsCpu, BsWrenchAdjustable, BsExclamationTriangle,
  BsFileEarmarkText, BsBoxSeam, BsTools, BsDropletHalf, BsPersonPlusFill
} from 'react-icons/bs';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DataTable from '../components/common/DataTable';
import { RequestDetailModal } from './RepairRequestPage';
import { getDashboardSummary } from '../services/dashboardService';
import { repairRequestService } from '../services/repairRequestService';
import { authService } from '../services/authService';
import { hasAnyRole } from '../services/roleService';
import './Dashboard.css';

/* --- Static config: KPI card definitions --- */
const KPI_CONFIG = [
  {
    key: 'totalEquipment', label: 'TỔNG THIẾT BỊ', icon: <BsCpu />,
    iconBg: '#e8f0fe', iconColor: '#004275',
  },
  {
    key: 'activeRepairRequests', label: 'YÊU CẦU ĐANG XỬ LÝ', icon: <BsWrenchAdjustable />,
    iconBg: '#fce8e8', iconColor: '#e53e3e',
  },
  {
    key: 'pendingWorkOrders', label: 'PCT CHỜ DUYỆT', icon: <BsFileEarmarkText />,
    iconBg: '#e8f5e9', iconColor: '#38a169',
    subtitle: 'Awaiting Approval',
  },
  {
    key: 'overdueToolBorrows', label: 'CCDC QUÁ HẠN', icon: <BsExclamationTriangle />,
    iconBg: '#fff3e0', iconColor: '#e53e3e',
    subtitle: 'Critical Action Req.', accent: 'danger',
  },
  {
    key: 'lowStockItems', label: 'TỒN KHO THẤP', icon: <BsBoxSeam />,
    iconBg: '#fce4ec', iconColor: '#c62828',
    subtitle: 'Items below threshold', accent: 'danger',
  },
];

/* --- Pie chart colors by equipment status --- */
const PIE_COLORS = {
  ACTIVE: '#38a169',
  MAINTENANCE: '#3182ce',
  STANDBY: '#a0aec0',
  FAILURE: '#e53e3e',
  RETIRED: '#718096',
};

/* --- Priority mapping for table badge --- */
const PRIORITY_MAP = {
  HIGH: { status: 'danger', label: 'Khẩn cấp' },
  MEDIUM: { status: 'warning', label: 'Trung bình' },
  LOW: { status: 'normal', label: 'Thấp' },
};

/* --- Tooltip style (reusable) --- */
const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  fontSize: '12px',
};

/* --- Quick actions: route + role gating (khớp Sidebar.jsx / App.jsx; ADMIN thấy tất cả) --- */
const QUICK_ACTIONS = [
  {
    icon: <BsExclamationTriangle className="qa-icon" style={{ color: 'var(--color-status-warning)' }} />,
    label: <>Tạo yêu cầu<br />sửa chữa</>,
    route: '/repair/yeu-cau',
    roles: ['SHIFT_LEADER', 'CREW_LEADER', 'MAINTENANCE_FOREMAN', 'TEAM_LEADER'],
  },
  {
    icon: <BsFileEarmarkText className="qa-icon" style={{ color: 'var(--color-primary)' }} />,
    label: <>Lập phiếu<br />công tác</>,
    route: '/repair/phieu-cong-tac',
    roles: ['MAINTENANCE_FOREMAN', 'TEAM_LEADER', 'SHIFT_LEADER', 'CREW_LEADER'],
  },
  {
    icon: <BsBoxSeam className="qa-icon" style={{ color: 'var(--color-status-info)' }} />,
    label: <>Nhập kho<br />vật tư</>,
    route: '/material/import-export/consumable',
    roles: ['MATERIALS_STOREKEEPER'],
  },
  {
    icon: <BsDropletHalf className="qa-icon" style={{ color: 'var(--color-status-normal)' }} />,
    label: <>Lịch bảo<br />dưỡng</>,
    route: '/lubrication/plant',
    roles: ['TEAM_LEADER'],
  },
  {
    icon: <BsPersonPlusFill className="qa-icon" style={{ color: 'var(--color-accent)' }} />,
    label: <>Thêm mới<br />nhân sự</>,
    route: '/hr/employees/create',
    roles: ['HR_STAFF'],
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const visibleActions = QUICK_ACTIONS.filter((a) => hasAnyRole(currentUser, a.roles));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailTarget, setDetailTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Nạp chi tiết YC đầy đủ (mô tả, người YC...) qua endpoint list theo mã, rồi mở modal dùng chung.
  const handleViewDetail = async (row) => {
    try {
      const res = await repairRequestService.getList({ search: row.maPhieu, size: 1 });
      const found = res.data?.content?.[0];
      if (found) setDetailTarget(found);
      else toast.info('Không tìm thấy chi tiết yêu cầu');
    } catch {
      toast.error('Không thể tải chi tiết yêu cầu');
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu Dashboard..." />;

  /* Transform API data for charts */
  const trendData = (data?.repairTrend || []).map(item => ({
    month: item.month,
    yeuCau: item.totalRequests,
    hoanThanh: item.completedRequests,
  }));

  const pieData = (data?.equipmentDistribution || []).map(item => ({
    name: item.label,
    value: item.count,
    color: PIE_COLORS[item.status] || '#a0aec0',
  }));

  const barData = (data?.topRepairedEquipment || []).map(item => ({
    name: item.equipmentName,
    soLan: item.repairCount,
  }));

  const tableData = (data?.recentRequests || []).map(item => {
    const p = PRIORITY_MAP[item.priority] || PRIORITY_MAP.LOW;
    return {
      id: item.id,
      maPhieu: item.requestCode,
      thietBi: item.equipmentName,
      kksCode: item.kksCode,
      mucDo: p.status,
      mucDoLabel: p.label,
      ngay: item.createdAt,
    };
  });

  const requestColumns = [
    { key: 'maPhieu', label: 'Mã phiếu', mono: true },
    { key: 'thietBi', label: 'Thiết bị' },
    { key: 'kksCode', label: 'Mã KKS', mono: true },
    {
      key: 'mucDo', label: 'Mức độ',
      render: (val, row) => <StatusBadge status={val} label={row.mucDoLabel} pulse={val === 'danger'} />,
    },
    { key: 'ngay', label: 'Ngày tạo' },
  ];

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan tình trạng vận hành nhà máy"
        icon={<BsGrid1X2 />}
      />

      {/* Stats Cards — Template Style */}
      <Row className="g-3 mb-4 stagger-children">
        {KPI_CONFIG.map((cfg, i) => (
          <Col key={i} xs={6} xl>
            <div className={`stat-card hover-lift ${cfg.accent ? 'accent-' + cfg.accent : ''}`}>
              <div className="stat-card-header">
                <span className="stat-card-label">{cfg.label}</span>
                <div
                  className="stat-card-icon-badge"
                  style={{ background: cfg.iconBg, color: cfg.iconColor }}
                >
                  {cfg.icon}
                </div>
              </div>
              <span className="stat-card-value">
                {(data?.[cfg.key] ?? 0).toLocaleString('vi-VN')}
              </span>
              {cfg.subtitle && <span className="stat-card-subtitle">{cfg.subtitle}</span>}
            </div>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row className="g-3 mb-4">
        {/* Area Chart: Repair trend */}
        <Col lg={8}>
          <Card className="dashboard-chart-card">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <span><BsWrenchAdjustable className="me-2" />Xu hướng Sửa chữa (6 tháng)</span>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradYeuCau" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#004275" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#004275" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradHoanThanh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38a169" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38a169" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-outline)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-outline)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="yeuCau" name="Yêu cầu" stroke="#004275" fill="url(#gradYeuCau)" strokeWidth={2} />
                  <Area type="monotone" dataKey="hoanThanh" name="Hoàn thành" stroke="#38a169" fill="url(#gradHoanThanh)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Pie Chart: Equipment status */}
        <Col lg={4}>
          <Card className="dashboard-chart-card">
            <Card.Header>
              <BsCpu className="me-2" />Phân bổ Thiết bị
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [`${value} thiết bị`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="pie-legend">
                {pieData.map((item, i) => (
                  <div key={i} className="pie-legend-item">
                    <span className="pie-legend-dot" style={{ background: item.color }} />
                    <span className="pie-legend-label">{item.name}</span>
                    <span className="pie-legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        {/* Bar Chart: Top equipment repairs */}
        <Col lg={4}>
          <Card className="dashboard-chart-card">
            <Card.Header>
              <BsTools className="me-2" />Top Sửa chữa nhiều nhất
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-outline)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--color-outline)' }} width={100} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} lần`, 'Số lần sửa']} />
                  <Bar dataKey="soLan" fill="#004275" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent repair requests */}
        <Col lg={8}>
          <Card>
            <Card.Header className="d-flex align-items-center justify-content-between">
              <span><BsFileEarmarkText className="me-2" />Yêu cầu sửa chữa gần đây</span>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable
                columns={requestColumns}
                data={tableData}
                searchable={false}
                pageSize={5}
                onView={handleViewDetail}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick actions — chỉ hiện nút user có quyền (ẩn cả card nếu không có nút nào) */}
      {visibleActions.length > 0 && (
        <Row className="g-3">
          <Col lg={12}>
            <Card>
              <Card.Header>
                <BsTools className="me-2" />Truy cập nhanh
              </Card.Header>
              <Card.Body className="quick-actions">
                {visibleActions.map((a) => (
                  <button
                    key={a.route}
                    className="quick-action-btn hover-lift"
                    onClick={() => navigate(a.route)}
                  >
                    {a.icon}
                    <span>{a.label}</span>
                  </button>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <RequestDetailModal
        request={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </>
  );
}
