import { useEffect, useId, useRef, useState } from 'react';
import { Pagination } from 'react-bootstrap';
import { BsSearch, BsXCircle, BsPersonPlus } from 'react-icons/bs';
import './SearchSelectField.css';

const PAGE_SIZE = 10;

export default function SearchSelectField({
  label, required, placeholder = 'Tìm kiếm...', emptyLabel,
  mode = 'single', searchFn, filterClient, getKey, renderItem,
  value, onChange, selectedLabel, excludedIds = [], onAdd, pendingKey, error,
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [content, setContent] = useState(null); // null = chưa tải lần đầu
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const inputId = useId();

  // searchFn là arrow inline trong modal → đổi identity mỗi render.
  // Giữ ref để effect fetch không lặp vô hạn.
  const searchRef = useRef(searchFn);
  useEffect(() => { searchRef.current = searchFn; });

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchRef.current({ query, page, size: PAGE_SIZE });
        if (cancelled) return;
        const d = res.data || res;
        setContent(Array.isArray(d.content) ? d.content : []);
        setTotalElements(d.totalElements ?? 0);
        setTotalPages(d.totalPages || 1);
      } catch {
        if (cancelled) return;
        setContent([]);
        setTotalElements(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, query, page]);

  useEffect(() => {
    const onDown = (ev) => {
      if (rootRef.current && !rootRef.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Esc đóng panel. Native listener trên root + stopPropagation, nếu không
  // Esc chạm handler của <Modal> và đóng luôn cả modal.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const onKey = (ev) => {
      if (ev.key === 'Escape' && open) { ev.stopPropagation(); setOpen(false); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [open]);

  // Lọc lúc RENDER chứ không lúc fetch: excludedIds/filterClient đổi (vừa thêm
  // 1 thành viên) thì list cập nhật ngay, không phải gọi lại API.
  const excluded = new Set(excludedIds.map((x) => String(x)));
  let items = null;
  if (content) {
    items = content.filter((it) => !excluded.has(String(getKey(it))));
    if (filterClient) items = filterClient(items);
  }

  const pick = (item) => {
    if (mode === 'add') { onAdd?.(item); return; }
    onChange?.(item);
    setOpen(false);
  };

  const clear = () => {
    onChange?.(null);
    setOpen(false);
    setQuery('');
    setPage(0);
  };

  const hasValue = mode === 'single' && value != null && value !== '';

  return (
    <div className="ssf" ref={rootRef}>
      {label && (
        <label className="ssf-label" htmlFor={inputId}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {hasValue ? (
        <div className="ssf-selected">
          <span className="ssf-selected-text">{selectedLabel || emptyLabel || placeholder}</span>
          <button type="button" className="ssf-clear" onClick={clear} aria-label="Bỏ chọn" title="Bỏ chọn">
            <BsXCircle />
          </button>
        </div>
      ) : (
        <div className="input-group input-group-sm">
          <span className="input-group-text"><BsSearch /></span>
          <input
            id={inputId}
            type="text"
            className="form-control"
            aria-label={label || placeholder}
            placeholder={emptyLabel || placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setPage(0); setOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // không để Enter submit form Formik
                if (open && items && items.length > 0) pick(items[0]);
              }
            }}
          />
        </div>
      )}

      {open && !hasValue && (
        <div className={`ssf-panel${loading ? ' ssf-loading' : ''}`}>
          {!items ? (
            <div className="ssf-empty">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="ssf-empty">{loading ? 'Đang tải...' : 'Không tìm thấy'}</div>
          ) : (
            <>
              <div className="ssf-list">
                {items.map((it) => {
                  const key = getKey(it);
                  const pending = pendingKey != null && String(pendingKey) === String(key);
                  return (
                    <div key={key} className="ssf-item">
                      <div className="ssf-item-content">{renderItem(it)}</div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={pending}
                        onClick={() => pick(it)}
                      >
                        {mode === 'add'
                          ? (pending ? 'Đang thêm...' : <><BsPersonPlus /> Thêm</>)
                          : 'Chọn'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="ssf-footer">
                <span className="ssf-count">Tổng {totalElements} kết quả</span>
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev disabled={page === 0} onClick={() => setPage(page - 1)} />
                  <Pagination.Item active>{page + 1} / {totalPages}</Pagination.Item>
                  <Pagination.Next disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} />
                </Pagination>
              </div>
            </>
          )}
        </div>
      )}

      {error && <div className="ssf-error">{error}</div>}
    </div>
  );
}
