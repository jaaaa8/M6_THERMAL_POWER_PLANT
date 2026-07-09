import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import {
  BsBoxSeam, BsSearch, BsTrash, BsSave, BsXCircle,
  BsTools, BsDroplet, BsClockHistory, BsPlusLg, BsPrinter,
  BsChevronDown, BsChevronUp,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { workOrderService } from '../../services/workOrderService';
import * as sparePartService from '../../services/sparePartService';
import * as consumableService from '../../services/consumableService';
import { isTerminalStatus, openPdfBlob, blobErrorMessage } from './pdfUtils';

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

/**
 * SuppliesIssueModal — Tạo phiếu cấp vật tư GỘP (thay thế + tiêu hao) cho MỘT
 * phiếu công tác, và xem lịch sử các phiếu đã cấp.
 *
 * Backend: POST/GET /api/v1/work-orders/{workOrderId}/supplies-issues.
 * Ít nhất một dòng vật tư (bất kể loại) là bắt buộc; issuedBy lấy từ JWT.
 *
 * @param {boolean}  props.show
 * @param {object}   props.workOrder - {id, orderCode, status} (dòng từ danh sách PCT)
 * @param {Function} props.onClose
 * @param {Function} props.onCreated - (createdSuppliesIssue) => void
 */
export default function SuppliesIssueModal({ show, workOrder, onClose, onCreated }) {
  const [activeTab, setActiveTab] = useState('create');
  const [sparePartLines, setSparePartLines] = useState([]);
  const [consumableLines, setConsumableLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Lịch sử cấp phát — history.issues: các LẦN cấp (gom thay thế + tiêu hao
  // của cùng một hành động tạo), đánh số #1, #2... theo thời gian.
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printingIssueId, setPrintingIssueId] = useState(null);
  const [expandedIssueIds, setExpandedIssueIds] = useState([]);

  // Cache URL blob PDF theo LẦN cấp — chỉ render khi bấm LẦN ĐẦU (lần cấp bất
  // biến sau khi tạo nên cache an toàn); bấm lại mở thẳng URL, khỏi gọi API.
  const instancePdfUrlsRef = useRef({});

  // Reset toàn bộ khi mở cho một PCT (mới); thu hồi các URL blob đã cache khi
  // đóng modal / đổi PCT (cleanup chạy trước lượt mở kế tiếp và lúc unmount).
  useEffect(() => {
    if (show) {
      setActiveTab('create');
      setSparePartLines([]);
      setConsumableLines([]);
      setHistory(null);
      setExpandedIssueIds([]);
    }
    return () => {
      Object.values(instancePdfUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      instancePdfUrlsRef.current = {};
    };
  }, [show, workOrder?.id]);

  const loadHistory = useCallback(async () => {
    if (!workOrder?.id) return;
    setHistoryLoading(true);
    try {
      const res = await workOrderService.getSuppliesIssues(workOrder.id);
      setHistory({
        sparePartsIssues: res.data?.sparePartsIssues || [],
        consumableIssues: res.data?.consumableIssues || [],
        issues: res.data?.issues || [],
      });
    } catch (err) {
      toast.error(`Không thể tải lịch sử cấp phát: ${extractErrorMessage(err)}`);
      setHistory({ sparePartsIssues: [], consumableIssues: [], issues: [] });
    } finally {
      setHistoryLoading(false);
    }
  }, [workOrder]);

  // Tải lịch sử khi chuyển sang tab lịch sử lần đầu
  useEffect(() => {
    if (show && activeTab === 'history' && history === null && !historyLoading) {
      loadHistory();
    }
  }, [show, activeTab, history, historyLoading, loadHistory]);

  const totalLines = sparePartLines.length + consumableLines.length;

  const handleSubmit = async () => {
    if (totalLines === 0) {
      toast.warning('Phải chọn ít nhất một dòng vật tư (thay thế hoặc tiêu hao)');
      return;
    }
    const invalid = [...sparePartLines, ...consumableLines]
      .some((l) => !l.quantity || Number(l.quantity) <= 0);
    if (invalid) {
      toast.warning('Số lượng của mỗi dòng vật tư phải lớn hơn 0');
      return;
    }

    const payload = {};
    if (sparePartLines.length > 0) {
      payload.spareParts = sparePartLines.map((l) => ({
        sparePartId: l.id,
        quantity: Number(l.quantity),
      }));
    }
    if (consumableLines.length > 0) {
      payload.consumables = consumableLines.map((l) => ({
        consumableId: l.id,
        quantity: Number(l.quantity),
      }));
    }

    setSubmitting(true);
    try {
      const res = await workOrderService.createSuppliesIssue(workOrder.id, payload);
      const codes = [
        res.data?.sparePartsIssue?.issueCode,
        res.data?.consumableIssue?.issueCode,
      ].filter(Boolean).join(', ');
      toast.success(`Đã tạo phiếu cấp vật tư ${codes} cho PCT ${workOrder.orderCode}`);
      onCreated?.(res.data);
      onClose?.();
    } catch (err) {
      toast.error(`Không thể tạo phiếu cấp vật tư: ${extractErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Mở bản GỘP "Phiếu đề nghị cấp phát vật tư" — MỘT file gom tất cả dòng vật
   * tư đã cấp cho PCT. Nút chỉ hiện khi phiếu ĐÃ KẾT THÚC (bản lưu đóng băng
   * trên Cloudinary); phiếu còn sống dùng nút xuất PDF theo TỪNG lần cấp.
   * Fallback render qua API nếu bản lưu chưa có (VD upload Cloudinary lỗi lúc
   * đóng phiếu).
   */
  const handlePrint = async () => {
    if (workOrder.suppliesPdfPath) {
      window.open(workOrder.suppliesPdfPath, '_blank');
      return;
    }
    setPrinting(true);
    try {
      const res = await workOrderService.exportSuppliesIssuePdf(workOrder.id);
      openPdfBlob(res.data);
    } catch (err) {
      toast.error(`Không thể in phiếu cấp vật tư: ${await blobErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setPrinting(false);
    }
  };

  /**
   * Xuất PDF của MỘT LẦN cấp — lazy: chỉ render khi bấm lần đầu, sau đó cache
   * URL blob (không render nền / không lưu URL trước khi người dùng bấm).
   */
  const handlePrintInstance = async (issue) => {
    const cached = instancePdfUrlsRef.current[issue.id];
    if (cached) {
      window.open(cached, '_blank');
      return;
    }
    setPrintingIssueId(issue.id);
    try {
      const res = await workOrderService.exportSuppliesIssueInstancePdf(workOrder.id, issue.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      instancePdfUrlsRef.current[issue.id] = url;
      window.open(url, '_blank');
    } catch (err) {
      toast.error(`Không thể in lần cấp #${issue.seq}: ${await blobErrorMessage(err)}`, { autoClose: 8000 });
    } finally {
      setPrintingIssueId(null);
    }
  };

  const toggleExpanded = (issueKey) => {
    setExpandedIssueIds((prev) => (prev.includes(issueKey)
      ? prev.filter((k) => k !== issueKey)
      : [...prev, issueKey]));
  };

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
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
          <Tab eventKey="create" title={<span><BsPlusLg className="me-1" />Tạo phiếu cấp vật tư</span>}>
            <SupplyLinePicker
              title="Vật tư thay thế"
              icon={<BsTools />}
              searchFn={(name) => sparePartService.search({ name, page: 0, size: 10 })}
              codeKey="sparePartCode"
              lines={sparePartLines}
              setLines={setSparePartLines}
            />
            <SupplyLinePicker
              title="Vật tư tiêu hao"
              icon={<BsDroplet />}
              searchFn={(name) => consumableService.search({ name, page: 0, size: 10 })}
              codeKey="consumableCode"
              lines={consumableLines}
              setLines={setConsumableLines}
            />
            <div className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
              Phải có ít nhất một dòng vật tư. Người cấp phát được ghi nhận theo tài khoản đăng nhập.
            </div>
          </Tab>

          <Tab eventKey="history" title={<span><BsClockHistory className="me-1" />Lịch sử cấp phát</span>}>
            {historyLoading || history === null ? (
              <LoadingSpinner />
            ) : history.issues.length === 0 ? (
              <EmptyState
                icon={<BsBoxSeam />}
                title="Chưa có phiếu cấp vật tư"
                description="PCT này chưa được cấp vật tư lần nào."
              />
            ) : (
              // Mới nhất lên trước; số #seq cố định theo thời gian tạo.
              [...history.issues].reverse().map((issue) => {
                const issueKey = issue.id ?? `orphan-${issue.seq}`;
                return (
                  <SuppliesIssueInstanceCard
                    key={issueKey}
                    issue={issue}
                    expanded={expandedIssueIds.includes(issueKey)}
                    onToggle={() => toggleExpanded(issueKey)}
                    printing={printingIssueId === issue.id}
                    onPrint={issue.id != null ? () => handlePrintInstance(issue) : undefined}
                  />
                );
              })
            )}
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onClose} disabled={submitting}>
          <BsXCircle className="me-1" /> Đóng
        </Button>
        {/* Bản GỘP chỉ hiện khi phiếu đã kết thúc — mở bản lưu chốt sổ trên
            Cloudinary; phiếu còn sống xuất PDF theo TỪNG lần cấp ở mỗi thẻ. */}
        {activeTab === 'history' && isTerminalStatus(workOrder.status) && (
          <Button
            variant="outline-primary"
            size="sm"
            disabled={printing || !history || history.issues.length === 0}
            title="Mở bản lưu chốt sổ (PDF gộp mọi dòng vật tư đã cấp — phiếu đã kết thúc)"
            onClick={handlePrint}
          >
            <BsPrinter className="me-1" /> {printing ? 'Đang mở...' : 'In phiếu cấp vật tư (bản gộp)'}
          </Button>
        )}
        {activeTab === 'create' && (
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting || totalLines === 0}>
            <BsSave className="me-1" /> {submitting ? 'Đang lưu...' : 'Tạo phiếu cấp vật tư'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

/* ============================================================
   PICKER — tìm kiếm vật tư (spare part / consumable) + bảng dòng đã chọn
   ============================================================ */
function SupplyLinePicker({ title, icon, searchFn, codeKey, lines, setLines }) {
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
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2"
           style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
        {icon} {title} {lines.length > 0 && <Badge bg="primary" pill>{lines.length}</Badge>}
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
   CARD — MỘT LẦN cấp vật tư trong lịch sử: "Phiếu cấp vật tư #N — thời điểm —
   người cấp" + nút xem chi tiết (mặc định thu gọn) + nút xuất PDF đúng lần đó
   (lazy — chỉ render khi bấm lần đầu; onPrint = undefined với dữ liệu mồ côi
   trước V9, không xuất riêng được).
   ============================================================ */
function SuppliesIssueInstanceCard({ issue, expanded, onToggle, printing, onPrint }) {
  return (
    <div className="border rounded p-2 mb-2">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
        <span>
          <span style={{ fontWeight: 'var(--font-semibold)' }}>
            Phiếu cấp vật tư <span className="font-mono">#{issue.seq}</span>
          </span>
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
          {onPrint && (
            <Button
              variant="outline-primary"
              size="sm"
              disabled={printing}
              title="Xuất PDF đúng lần cấp này (render khi bấm lần đầu, lần sau mở lại bản đã tải)"
              onClick={onPrint}
            >
              <BsPrinter className="me-1" /> {printing ? 'Đang in...' : 'Xuất PDF'}
            </Button>
          )}
        </span>
      </div>
      {expanded && (
        <div className="mt-2">
          {issue.sparePartsIssue && (
            <IssueCard issue={issue.sparePartsIssue} typeLabel="Thay thế" codeKey="sparePartCode" nameKey="sparePartName" />
          )}
          {issue.consumableIssue && (
            <IssueCard issue={issue.consumableIssue} typeLabel="Tiêu hao" codeKey="consumableCode" nameKey="consumableName" />
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CARD — một phiếu cấp vật tư trong lịch sử
   ============================================================ */
function IssueCard({ issue, typeLabel, codeKey, nameKey }) {
  return (
    <div className="border rounded p-2 mb-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span>
          <Badge bg={typeLabel === 'Thay thế' ? 'info' : 'secondary'} className="me-2">{typeLabel}</Badge>
          <span className="font-mono" style={{ fontWeight: 'var(--font-semibold)' }}>{issue.issueCode}</span>
        </span>
        <span className="text-muted small">
          {issue.issuedByName || '—'} · {issue.issuedAt ? new Date(issue.issuedAt).toLocaleString('vi-VN') : '—'}
        </span>
      </div>
      <Table size="sm" bordered className="mb-0" style={{ fontSize: 'var(--text-xs)' }}>
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
              <td className="font-mono">{d[codeKey]}</td>
              <td>{d[nameKey]}</td>
              <td>{d.unitName || '—'}</td>
              <td>{d.quantity}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
