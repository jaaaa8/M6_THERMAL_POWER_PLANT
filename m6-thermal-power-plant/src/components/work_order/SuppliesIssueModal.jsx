import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import {
  BsBoxSeam, BsSearch, BsTrash, BsSave, BsXCircle,
  BsTools, BsDroplet, BsClockHistory, BsPlusLg,
  BsChevronDown, BsChevronUp,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { workOrderService } from '../../services/workOrderService';
import * as sparePartService from '../../services/sparePartService';
import * as consumableService from '../../services/consumableService';

/**
 * Lấy nguyên văn message lỗi backend trả về (GlobalExceptionHandler trả về
 * cả dạng JSON có `message` lẫn dạng CHUỖI THUẦN tuỳ exception).
 */
function extractErrorMessage(err) {
  const data = err.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && data.message) return data.message;
  return err.message || 'Lỗi không xác định';
}

/** Cấu hình riêng cho từng loại phiếu — 2 luồng ĐỘC LẬP, không còn gộp chung. */
const ISSUE_TYPES = {
  spareParts: {
    itemIdField: 'sparePartId',
    searchFn: (name) => sparePartService.search({ name, page: 0, size: 10 }),
    itemCodeKey: 'sparePartCode',
    lineNameKey: 'sparePartName',
    lineCodeKey: 'sparePartCode',
    label: 'vật tư thay thế',
    typeLabel: 'Thay thế',
    badgeBg: 'info',
    create: workOrderService.createSparePartsIssue,
    list: workOrderService.getSparePartsIssues,
  },
  consumables: {
    itemIdField: 'consumableId',
    searchFn: (name) => consumableService.search({ name, page: 0, size: 10 }),
    itemCodeKey: 'consumableCode',
    lineNameKey: 'consumableName',
    lineCodeKey: 'consumableCode',
    label: 'vật tư tiêu hao',
    typeLabel: 'Tiêu hao',
    badgeBg: 'secondary',
    create: workOrderService.createConsumableIssue,
    list: workOrderService.getConsumableIssues,
  },
};

/**
 * SuppliesIssueModal — 2 luồng cấp vật tư ĐỘC LẬP cho MỘT phiếu công tác: vật
 * tư thay thế và vật tư tiêu hao mỗi loại có nút tạo phiếu + lịch sử riêng
 * (2 endpoint backend riêng, không còn 1 request gộp cả hai loại).
 *
 * @param {boolean}  props.show
 * @param {object}   props.workOrder - {id, orderCode, status}
 * @param {Function} props.onClose
 * @param {Function} props.onCreated - (createdIssue, type) => void
 */
export default function SuppliesIssueModal({ show, workOrder, onClose, onCreated }) {
  const [activeType, setActiveType] = useState('spareParts');

  if (!workOrder) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsBoxSeam className="me-2" style={{ color: 'var(--color-primary-500)' }} />
          Cấp vật tư — PCT <span className="font-mono">{workOrder.orderCode}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Tabs activeKey={activeType} onSelect={(k) => setActiveType(k)} className="mb-3">
          <Tab eventKey="spareParts" title={<span><BsTools className="me-1" />Vật tư thay thế</span>}>
            <SupplyIssuePanel
              key={`spareParts-${workOrder.id}`}
              show={show}
              workOrder={workOrder}
              config={ISSUE_TYPES.spareParts}
              onCreated={(created) => onCreated?.(created, 'spareParts')}
              onClose={onClose}
            />
          </Tab>
          <Tab eventKey="consumables" title={<span><BsDroplet className="me-1" />Vật tư tiêu hao</span>}>
            <SupplyIssuePanel
              key={`consumables-${workOrder.id}`}
              show={show}
              workOrder={workOrder}
              config={ISSUE_TYPES.consumables}
              onCreated={(created) => onCreated?.(created, 'consumables')}
              onClose={onClose}
            />
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
}

/* ============================================================
   PANEL — luồng tạo phiếu + lịch sử của MỘT loại vật tư (độc lập hoàn toàn
   với loại còn lại: state riêng, submit riêng, PDF riêng).
   ============================================================ */
function SupplyIssuePanel({ show, workOrder, config, onCreated, onClose }) {
  const [activeSubTab, setActiveSubTab] = useState('create');
  const [lines, setLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedIssueIds, setExpandedIssueIds] = useState([]);

  useEffect(() => {
    if (show) {
      setActiveSubTab('create');
      setLines([]);
      setHistory(null);
      setExpandedIssueIds([]);
    }
  }, [show]);

  const loadHistory = useCallback(async () => {
    if (!workOrder?.id) return;
    setHistoryLoading(true);
    try {
      const res = await config.list(workOrder.id);
      setHistory(res.data || []);
    } catch (err) {
      toast.error(`Không thể tải lịch sử cấp phát: ${extractErrorMessage(err)}`);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [workOrder, config]);

  useEffect(() => {
    if (show && activeSubTab === 'history' && history === null && !historyLoading) {
      loadHistory();
    }
  }, [show, activeSubTab, history, historyLoading, loadHistory]);

  const handleSubmit = async () => {
    if (lines.length === 0) {
      toast.warning(`Phải chọn ít nhất một dòng ${config.label}`);
      return;
    }
    const invalid = lines.some((l) => !l.quantity || Number(l.quantity) <= 0);
    if (invalid) {
      toast.warning('Số lượng của mỗi dòng vật tư phải lớn hơn 0');
      return;
    }

    const payload = {
      items: lines.map((l) => ({ [config.itemIdField]: l.id, quantity: Number(l.quantity) })),
    };

    setSubmitting(true);
    try {
      const res = await config.create(workOrder.id, payload);
      toast.success(`Đã tạo phiếu cấp ${config.label} ${res.data?.issueCode || ''} cho PCT ${workOrder.orderCode}`);
      onCreated?.(res.data);
      onClose?.();
    } catch (err) {
      toast.error(`Không thể tạo phiếu cấp ${config.label}: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpanded = (issueId) => {
    setExpandedIssueIds((prev) => (prev.includes(issueId)
      ? prev.filter((k) => k !== issueId)
      : [...prev, issueId]));
  };

  return (
    <>
      <Tabs activeKey={activeSubTab} onSelect={(k) => setActiveSubTab(k)} className="mb-3">
        <Tab eventKey="create" title={<span><BsPlusLg className="me-1" />Tạo phiếu</span>}>
          <SupplyLinePicker
            title={config.label[0].toUpperCase() + config.label.slice(1)}
            searchFn={config.searchFn}
            codeKey={config.itemCodeKey}
            lines={lines}
            setLines={setLines}
          />
          <div className="text-muted mb-3" style={{ fontSize: 'var(--text-xs)' }}>
            Phải có ít nhất một dòng {config.label}. Người cấp phát được ghi nhận theo tài khoản đăng nhập.
          </div>
          <div className="d-flex justify-content-end">
            <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting || lines.length === 0}>
              <BsSave className="me-1" /> {submitting ? 'Đang lưu...' : `Tạo phiếu cấp ${config.label}`}
            </Button>
          </div>
        </Tab>

        <Tab eventKey="history" title={<span><BsClockHistory className="me-1" />Lịch sử</span>}>
          {historyLoading || history === null ? (
            <LoadingSpinner />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<BsBoxSeam />}
              title="Chưa có phiếu cấp vật tư"
              description={`PCT này chưa được cấp ${config.label} lần nào.`}
            />
          ) : (
            [...history].reverse().map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                config={config}
                expanded={expandedIssueIds.includes(issue.id)}
                onToggle={() => toggleExpanded(issue.id)}
              />
            ))
          )}
        </Tab>
      </Tabs>
    </>
  );
}

/* ============================================================
   PICKER — tìm kiếm vật tư (spare part / consumable) + bảng dòng đã chọn
   ============================================================ */
function SupplyLinePicker({ title, searchFn, codeKey, lines, setLines }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Debounce tìm kiếm 300ms
  useEffect(() => {
    const q = term.trim();
    if (!q) {
      setResults([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchFn(q);
        setResults(res.data?.content || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // searchFn là arrow mới mỗi render — cố tình bỏ khỏi deps để không tìm lại vô hạn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const addLine = (item) => {
    if (lines.some((l) => l.id === item.id)) {
      toast.info('Vật tư đã có trong danh sách');
      return;
    }
    setLines([...lines, {
      id: item.id,
      code: item[codeKey],
      name: item.name,
      unitName: item.unitName,
      quantity: '1',
    }]);
    setTerm('');
    setResults([]);
  };

  const updateQuantity = (id, quantity) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, quantity } : l)));
  };

  const removeLine = (id) => {
    setLines(lines.filter((l) => l.id !== id));
  };

  return (
    <div className="mb-3">
      <div className="d-flex align-items-center gap-2 mb-2"
           style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
        {title} {lines.length > 0 && <Badge bg="primary" pill>{lines.length}</Badge>}
      </div>

      {/* Ô tìm kiếm */}
      <div className="position-relative mb-2">
        <div className="input-group input-group-sm">
          <span className="input-group-text"><BsSearch /></span>
          <input
            type="text"
            className="form-control"
            placeholder={`Tìm ${title.toLowerCase()} theo tên...`}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        {term.trim() && (
          <div className="list-group position-absolute w-100 shadow-sm"
               style={{ zIndex: 10, maxHeight: 220, overflowY: 'auto' }}>
            {searching ? (
              <div className="list-group-item text-muted small">Đang tìm...</div>
            ) : results.length === 0 ? (
              <div className="list-group-item text-muted small">Không tìm thấy vật tư nào</div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  onClick={() => addLine(item)}
                >
                  <span>
                    <span className="font-mono me-2 text-muted small">{item[codeKey]}</span>
                    {item.name}
                  </span>
                  <span className="text-muted small">{item.unitName}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bảng dòng đã chọn */}
      {lines.length > 0 && (
        <Table size="sm" bordered hover className="mb-0" style={{ fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr>
              <th style={{ width: 130 }}>Mã</th>
              <th>Tên vật tư</th>
              <th style={{ width: 80 }}>Đơn vị</th>
              <th style={{ width: 110 }}>Số lượng</th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td className="font-mono">{l.code}</td>
                <td>{l.name}</td>
                <td>{l.unitName || '—'}</td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="0"
                    step="any"
                    value={l.quantity}
                    onChange={(e) => updateQuantity(l.id, e.target.value)}
                  />
                </td>
                <td className="text-center">
                  <Button variant="outline-danger" size="sm" title="Xoá dòng"
                          onClick={() => removeLine(l.id)}>
                    <BsTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

/* ============================================================
   CARD — MỘT phiếu cấp vật tư trong lịch sử (mã phiếu — thời điểm — người
   cấp) + nút xem chi tiết (mặc định thu gọn).
   ============================================================ */
function IssueCard({ issue, config, expanded, onToggle }) {
  return (
    <div className="border rounded p-2 mb-2">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
        <span>
          <Badge bg={config.badgeBg} className="me-2">{config.typeLabel}</Badge>
          <span className="font-mono" style={{ fontWeight: 'var(--font-semibold)' }}>{issue.issueCode}</span>
          <span className="text-muted small ms-2">
            {issue.issuedAt ? new Date(issue.issuedAt).toLocaleString('vi-VN') : '—'}
            {' · '}{issue.issuedByName || '—'}
          </span>
        </span>
        <span className="d-flex gap-1">
          <Button variant="outline-secondary" size="sm" onClick={onToggle}>
            {expanded ? <BsChevronUp className="me-1" /> : <BsChevronDown className="me-1" />}
            {expanded ? 'Thu gọn' : 'Chi tiết'}
          </Button>
        </span>
      </div>
      {expanded && (
        <Table size="sm" bordered className="mb-0 mt-2" style={{ fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr>
              <th style={{ width: 130 }}>Mã</th>
              <th>Tên vật tư</th>
              <th style={{ width: 80 }}>Đơn vị</th>
              <th style={{ width: 90 }}>Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {(issue.details || []).map((d) => (
              <tr key={d.id}>
                <td className="font-mono">{d[config.lineCodeKey]}</td>
                <td>{d[config.lineNameKey]}</td>
                <td>{d.unitName || '—'}</td>
                <td>{d.quantity}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
