import { useRef, useState } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  BsFileEarmarkExcel, BsUpload, BsCheckCircleFill, BsXCircleFill,
  BsXCircle, BsCloudUpload, BsDownload,
} from 'react-icons/bs';
import { toolService } from '../../services/toolService';

/**
 * ToolImportModal — Nhập CCDC hàng loạt từ file Excel.
 * Luồng: chọn file → xem trước (preview) → xác nhận nhập (all-or-nothing).
 *
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Function} props.onImported  gọi lại sau khi import thành công (để reload danh sách)
 */
export default function ToolImportModal({ show, onClose, onImported }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);   // ToolImportResult
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await toolService.downloadImportTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-nhap-ccdc.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Không tải được file mẫu');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setLoading(true);
    try {
      const res = await toolService.previewImport(f);
      setPreview(res.data?.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đọc được file. Kiểm tra lại định dạng .xlsx');
      reset();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file || !preview?.allValid) return;
    setImporting(true);
    try {
      const res = await toolService.confirmImport(file);
      toast.success(res.data?.message || 'Nhập CCDC thành công');
      onImported?.();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nhập thất bại');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
          <BsFileEarmarkExcel className="me-2" style={{ color: 'var(--color-status-normal)' }} />
          Nhập CCDC từ Excel
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Bước 1: tải mẫu + chọn file */}
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <Button variant="outline-success" size="sm" onClick={handleDownloadTemplate} disabled={downloading}>
            <BsDownload className="me-1" /> {downloading ? 'Đang tải...' : 'Tải file mẫu'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button variant="outline-primary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <BsUpload className="me-1" /> Chọn file Excel
          </Button>
          {file && <span className="text-muted small">{file.name}</span>}
        </div>

        <div className="text-muted small mb-3">
          Cột trong file: <strong>Tên CCDC · Chủng loại · Đơn vị tính · Số lượng · Ghi chú</strong>.
          Mã CCDC hệ thống tự sinh. Chủng loại phải điền đúng tên đã có trong hệ thống.
        </div>

        {loading && <div className="text-center text-muted py-3">Đang đọc file...</div>}

        {/* Bước 2: preview */}
        {preview && (
          <>
            <div className="mb-2">
              <span className="me-3"><strong>{preview.totalRows}</strong> dòng</span>
              <span className="text-success me-3">
                <BsCheckCircleFill className="me-1" />{preview.validCount} hợp lệ
              </span>
              {preview.errorCount > 0 && (
                <span className="text-danger">
                  <BsXCircleFill className="me-1" />{preview.errorCount} lỗi
                </span>
              )}
            </div>

            {!preview.allValid && (
              <div className="alert alert-warning py-2 small mb-2">
                Còn dòng lỗi — sửa hết trong file Excel rồi chọn lại. Không dòng nào được nhập khi còn lỗi.
              </div>
            )}

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Table size="sm" bordered hover className="mb-0">
                <thead style={{ position: 'sticky', top: 0, background: 'var(--color-surface)' }}>
                  <tr>
                    <th style={{ width: 50 }}>Dòng</th>
                    <th>Tên CCDC</th>
                    <th>Chủng loại</th>
                    <th style={{ width: 80 }}>ĐVT</th>
                    <th style={{ width: 60 }}>SL</th>
                    <th style={{ width: 200 }}>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.rowNumber} className={r.valid ? '' : 'table-danger'}>
                      <td>{r.rowNumber}</td>
                      <td>{r.name}</td>
                      <td>{r.categoryName}</td>
                      <td>{r.unit}</td>
                      <td>{r.quantity ?? ''}</td>
                      <td>
                        {r.valid ? (
                          <span className="text-success"><BsCheckCircleFill className="me-1" />Hợp lệ</span>
                        ) : (
                          <span className="text-danger"><BsXCircleFill className="me-1" />{r.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={handleClose} disabled={importing}>
          <BsXCircle /> Đóng
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirmImport}
          disabled={!preview?.allValid || importing}
        >
          <BsCloudUpload /> {importing ? 'Đang nhập...' : `Xác nhận nhập ${preview?.validCount || 0} CCDC`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
