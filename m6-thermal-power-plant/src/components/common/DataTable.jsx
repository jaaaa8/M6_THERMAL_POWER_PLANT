import { useState, useMemo } from 'react';
import { Table, Pagination as BsPagination } from 'react-bootstrap';
import { BsSortDown, BsSortUp, BsChevronLeft, BsChevronRight, BsEye, BsPencil, BsTrash } from 'react-icons/bs';
import SearchBox from './SearchBox';
import EmptyState from './EmptyState';
import './DataTable.css';

/**
 * DataTable — Bảng dữ liệu tái sử dụng với search, sort, pagination.
 *
 * @param {Array} props.columns - Cấu hình cột: [{ key, label, sortable, render, width, mono }]
 * @param {Array} props.data - Dữ liệu
 * @param {boolean} [props.searchable=true] - Hiển thị ô tìm kiếm
 * @param {string} [props.searchPlaceholder] - Placeholder ô tìm kiếm
 * @param {number} [props.pageSize=10] - Số dòng mỗi trang
 * @param {Function} [props.onView] - Callback xem chi tiết (row) => void
 * @param {Function} [props.onEdit] - Callback sửa (row) => void
 * @param {Function} [props.onDelete] - Callback xoá (row) => void
 * @param {Function} [props.renderActions] - Custom render cột actions
 * @param {boolean} [props.loading=false]
 */
export default function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Tìm kiếm...',
  pageSize = 5,
  onView,
  onEdit,
  onDelete,
  renderActions,
  loading = false,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), 'vi', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const hasActions = onView || onEdit || onDelete || renderActions;

  // Loading skeleton
  if (loading) {
    return (
      <div className="data-table-wrapper surface-card">
        <div className="data-table-toolbar">
          <div className="skeleton" style={{ width: 240, height: 36 }} />
        </div>
        <div style={{ padding: 'var(--space-4)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 20, marginBottom: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper surface-card">
      {/* Toolbar */}
      {searchable && (
        <div className="data-table-toolbar">
          <SearchBox
            placeholder={searchPlaceholder}
            value={search}
            onSearch={handleSearch}
          />
          <span className="data-table-count">
            {filtered.length} kết quả
          </span>
        </div>
      )}

      {/* Table */}
      {paged.length === 0 ? (
        <EmptyState
          title="Không tìm thấy"
          message={search ? `Không có kết quả cho "${search}"` : 'Chưa có dữ liệu nào.'}
        />
      ) : (
        <div className="data-table-scroll">
          <Table hover className="data-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width, cursor: col.sortable !== false ? 'pointer' : 'default' }}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <span className="data-table-th-inner">
                      {col.label}
                      {col.sortable !== false && sortKey === col.key && (
                        sortDir === 'asc' ? <BsSortUp /> : <BsSortDown />
                      )}
                    </span>
                  </th>
                ))}
                {hasActions && <th style={{ width: 120 }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td className="text-muted">{(safePage - 1) * pageSize + idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} className={col.mono ? 'font-mono' : ''}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {hasActions && (
                    <td>
                      {renderActions ? renderActions(row) : (
                        <div className="data-table-actions">
                          {onView && (
                            <button className="btn btn-sm btn-outline-primary" onClick={() => onView(row)} title="Xem">
                              <BsEye />
                            </button>
                          )}
                          {onEdit && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(row)} title="Sửa">
                              <BsPencil />
                            </button>
                          )}
                          {onDelete && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(row)} title="Xoá">
                              <BsTrash />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="data-table-pagination">
          <span className="data-table-pagination-info">
            Trang {safePage} / {totalPages}
          </span>
          <BsPagination size="sm" className="mb-0">
            <BsPagination.Prev
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <BsChevronLeft />
            </BsPagination.Prev>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (safePage <= 3) {
                pageNum = i + 1;
              } else if (safePage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = safePage - 2 + i;
              }
              return (
                <BsPagination.Item
                  key={pageNum}
                  active={pageNum === safePage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </BsPagination.Item>
              );
            })}
            <BsPagination.Next
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <BsChevronRight />
            </BsPagination.Next>
          </BsPagination>
        </div>
      )}
    </div>
  );
}
