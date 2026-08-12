# SearchSelectField Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển mọi trường `<select>` trong 5 modal của 2 trang `/repair/phieu-cong-tac` và `/repair/yeu-cau` thành ô search server-side, kết quả phân trang 10 phần tử/trang.

**Architecture:** Component dùng chung `SearchSelectField` (mode `single` chọn 1 / mode `add` thêm vào chip) nhận `searchFn` + `filterClient` từ modal. Backend thêm **một** param tự do cho mỗi endpoint (`keyword` cho nhân viên, `kw` cho thiết bị) và tự OR các cột — vì predicate hiện tại nối bằng `AND`, gửi cùng chuỗi vào 2 param sẽ luôn ra rỗng. Mỗi modal giữ nguyên bộ lọc hiện tại (busy/exclude/role GSAT) bằng cách truyền xuống `filterClient` và `excludedIds`; component lọc **lúc render** nên list tự cập nhật sau mỗi lần thêm.

**Tech Stack:** React 19 + react-bootstrap 2.10 + Formik + Yup (frontend, `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant`); Spring Boot + **Gradle** (backend, `D:\smcs\M6_THERMAL_POWER_PLANT_API` — repo **không có** `pom.xml`, đừng gõ `mvn`).

## Global Constraints

- Frontend: `npm run lint` sạch với file mình chạm (eslint 9 flat config), `npm run build` pass.
- Backend: `.\gradlew.bat compileJava` pass; `.\gradlew.bat test` giữ baseline **89 tests / 20 failed** (20 failure H2 có sẵn ở `AccountSearchServiceDbTest`, `DepartmentSearchServiceDbTest`, `EmployeeSearchServiceDbTest`). Failure thứ 21 là do mình.
- Không thêm dependency mới. Không thêm comment trừ khi sửa logic hiện có cần giải thích.
- Không sửa validation Formik/Yup (chỉ đổi cách hiển thị error).
- Không sửa picker thiết bị đa chọn trong `CreateManualWorkOrderModal`, radio priority trong `CreateRequestModal`, `WorkOrderStatusModal`.
- Không đổi hành vi param cũ của endpoint (`name`/`phone`/`gmail`/`departmentId`/`isActive` của `/employees/search`; `kks`/`name`/`systemId`/`typeId`/`status` của `/equipments`) — chỉ **thêm** param mới.
- Repo riêng: frontend = `M6_THERMAL_POWER_PLANT`, backend = `M6_THERMAL_POWER_PLANT_API`. Commit riêng từng repo.
- Frontend KHÔNG có test framework (`package.json` chỉ có dev/build/lint/preview) — verify bằng lint + build + manual E2E (Task 8).

---

### Task 1: Backend — param search tự do cho nhân viên và thiết bị

**Files:**
- Modify: `...\dto\employee\EmployeeSearchRequestDTO.java`
- Modify: `...\service\employee\EmployeeService.java` (trong `searchEmployees`, cạnh predicate `name`)
- Modify: `...\repository\equipment\IEquipmentRepository.java` (query `getEquipment` + countQuery)
- Modify: `...\service\equipment\IEquipmentService.java`
- Modify: `...\service\equipment\EquipmentService.java`
- Modify: `...\controller\equipment\EquipmentController.java`

(gốc: `D:\smcs\M6_THERMAL_POWER_PLANT_API\src\main\java\com\example\m6_thermal_power_plant_api`)

**Interfaces:**
- Produces: `GET /api/v1/employees/search?keyword=...&page=...&size=...` → `Page<EmployeeResponseDTO>` (`content, totalElements, totalPages, number`), mỗi phần tử có `id, employeeCode, fullName, department{name}, position{name}, isActive, account{roles:[{name}]}`. `keyword` OR trên fullName / employeeCode / department.name / position.name.
- Produces: `GET /api/v1/equipments?kw=...&systemId=...&page=...&size=...` → `Page<ListEquipmentDTO>`. `kw` OR trên kks_code / name.
- Task 3–7 tiêu thụ 2 endpoint này.

- [ ] **Step 1: Thêm field `keyword` vào `EmployeeSearchRequestDTO`**

Sau field `isActive`:

```java
    private String keyword;
```

- [ ] **Step 2: Thêm predicate OR trong `searchEmployees`**

Trong `EmployeeService.java`, method `searchEmployees`, ngay sau khối `if (searchRequest.getIsActive() != null ...)`:

```java
            if (searchRequest.getKeyword() != null && !searchRequest.getKeyword().trim().isEmpty()) {
                String kw = "%" + searchRequest.getKeyword().trim().toLowerCase() + "%";
                // LEFT JOIN: nhân viên chưa có phòng ban / chức vụ vẫn phải tìm ra được.
                var dept = root.join("department", jakarta.persistence.criteria.JoinType.LEFT);
                var pos = root.join("position", jakarta.persistence.criteria.JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), kw),
                        cb.like(cb.lower(root.get("employeeCode")), kw),
                        cb.like(cb.lower(dept.get("name")), kw),
                        cb.like(cb.lower(pos.get("name")), kw)
                ));
            }
```

Giữ nguyên predicate `name` cũ — `ListEmployee.jsx:81` là caller duy nhất còn lại và vẫn dùng nó.

- [ ] **Step 3: Thêm `:kw` vào query thiết bị**

Trong `IEquipmentRepository.java`, thêm **cùng một dòng** vào cả query chính lẫn `countQuery` (ngay sau dòng `:name`):

```sql
            AND (:kw IS NULL OR e.kks_code LIKE CONCAT('%',:kw,'%') OR e.name LIKE CONCAT('%',:kw,'%'))
```

và thêm param vào signature (sau `@Param("name") String name`):

```java
            @Param("kw") String kw,
```

- [ ] **Step 4: Luồng `kw` qua service + controller**

- `IEquipmentService.java`: `Page<ListEquipmentDTO> getEquipmentList(Integer systemId, String kks, String name, String kw, Integer typeId, String status, Pageable pageable);`
- `EquipmentService.java`: thêm tham số `String kw` vào `getEquipmentList` và truyền xuống `equipmentRepository.getEquipment(systemId, kks, name, kw, typeId, status, page)`.
- `EquipmentController.java`: thêm `@RequestParam(required = false) String kw` vào `getEquipmentList` và truyền xuống.

Caller cũ không truyền `kw` → `null` → query không đổi hành vi.

- [ ] **Step 5: Biên dịch + test backend**

Run (workdir `D:\smcs\M6_THERMAL_POWER_PLANT_API`):

```
.\gradlew.bat compileJava
.\gradlew.bat test
```

Expected: `compileJava` BUILD SUCCESSFUL; `test` đúng **89 tests, 20 failed** (không hơn). Nếu ra 21 failed → đọc failure mới trước khi đi tiếp.

- [ ] **Step 6: Kiểm bằng tay (app đang chạy)**

`.\gradlew.bat bootRun`, rồi gọi:
- `GET /api/v1/employees/search?keyword=nguyen&page=0&size=10` → ra theo tên
- `GET /api/v1/employees/search?keyword=NV001&page=0&size=10` → ra theo mã
- `GET /api/v1/employees/search?name=nguyen` → vẫn chạy như cũ
- `GET /api/v1/equipments?kw=bom&page=0&size=10` và `?kw=KKS` → cả 2 ra kết quả
- `GET /api/v1/equipments?kks=KKS01` → vẫn chạy như cũ

- [ ] **Step 7: Commit backend**

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT_API" add src/main/java/com/example/m6_thermal_power_plant_api/dto/employee/EmployeeSearchRequestDTO.java src/main/java/com/example/m6_thermal_power_plant_api/service/employee/EmployeeService.java src/main/java/com/example/m6_thermal_power_plant_api/repository/equipment/IEquipmentRepository.java src/main/java/com/example/m6_thermal_power_plant_api/service/equipment/IEquipmentService.java src/main/java/com/example/m6_thermal_power_plant_api/service/equipment/EquipmentService.java src/main/java/com/example/m6_thermal_power_plant_api/controller/equipment/EquipmentController.java
git -C "D:\smcs\M6_THERMAL_POWER_PLANT_API" commit -m "feat: them param keyword (employee) va kw (equipment) search OR nhieu cot"
```

---

### Task 2: Component `SearchSelectField`

**Files:**
- Create: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\common\SearchSelectField.jsx`
- Create: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\common\SearchSelectField.css`

**Interfaces:**
- Consumes: `searchFn` trả về Promise resolve `{ data: { content, totalElements, totalPages } }` (chuẩn axios + Spring Page).
- Produces (Task 3–7 tiêu thụ):

```
Props:
  label?: string                   // nhãn; bỏ trống thì modal tự render <Form.Label>
  required?: boolean               // dấu *
  placeholder?: string             // gợi ý ô search (mặc định 'Tìm kiếm...')
  emptyLabel?: string              // text khi chưa chọn (vd '— Giữ nguyên —')
  mode: 'single' | 'add'
  searchFn: (p: {query, page, size}) => Promise   // size luôn 10
  filterClient?: (list) => list    // lọc lúc RENDER (busy/role...)
  getKey: (item) => string|number
  renderItem: (item) => ReactNode
  value?: string|number|null       // single: id đang chọn ('' hoặc null = chưa chọn)
  onChange?: (item|null) => void   // single: item chọn được / null khi bỏ chọn
  selectedLabel?: string           // single: text hiển thị khi đã chọn (modal tự quản lý)
  excludedIds?: Array<string|number>  // loại khỏi kết quả
  onAdd?: (item) => void           // add: thêm vào chip (modal quản lý list)
  pendingKey?: string|number       // add: key đang gọi API → nút disabled + 'Đang thêm...'
  error?: string                   // text lỗi Formik
```

- [ ] **Step 1: Viết component**

```jsx
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
    setLoading(true);
    const timer = setTimeout(async () => {
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
```

Nếu eslint báo `react-hooks/exhaustive-deps` ở effect fetch: **không** thêm `searchFn`/`filterClient`/`excludedIds` vào deps (sẽ fetch vô hạn) — thêm `// eslint-disable-next-line react-hooks/exhaustive-deps` kèm lý do ngay trên dòng deps.

- [ ] **Step 2: Viết CSS**

`SearchSelectField.css`:

```css
.ssf { position: relative; margin-bottom: 1rem; }
.ssf-label { display: block; font-size: var(--text-sm); font-weight: var(--font-semibold); margin-bottom: 0.375rem; }
.ssf-selected {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.375rem 0.75rem; border: 1px solid var(--border-color);
  border-radius: 0.25rem; background: var(--color-surface-container);
  font-size: var(--text-sm);
}
.ssf-selected-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ssf-clear { border: 0; background: transparent; color: var(--text-tertiary); padding: 0 0.25rem; }
.ssf-clear:hover { color: var(--color-status-danger); }
.ssf-panel {
  position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 1050;
  border: 1px solid var(--border-color); border-radius: 0.25rem;
  background: var(--color-surface); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.ssf-loading { opacity: 0.6; }
.ssf-empty { padding: 0.75rem; text-align: center; color: var(--text-tertiary); font-size: var(--text-sm); }
/* max-height nằm ở .ssf-list để footer phân trang không bị cuộn mất */
.ssf-list { padding: 0.25rem; max-height: 300px; overflow-y: auto; }
.ssf-item {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding: 0.375rem 0.5rem; border-radius: 0.25rem;
}
.ssf-item:hover { background: var(--color-surface-container); }
.ssf-item-content { flex: 1; min-width: 0; font-size: var(--text-sm); }
.ssf-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding: 0.375rem 0.75rem; border-top: 1px solid var(--border-color);
  background: var(--color-surface-container);
}
.ssf-count { font-size: var(--text-xs); color: var(--text-tertiary); white-space: nowrap; }
.ssf-error { margin-top: 0.25rem; font-size: var(--text-xs); color: var(--color-status-danger); }
```

Các biến CSS trên đều đã tồn tại trong dự án (dùng ở `WorkOrderList.css`, `RepairRequestPage.css`...) — không cần khai báo mới.

- [ ] **Step 3: Lint**

Run (workdir `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant`): `npm run lint`
Expected: không lỗi liên quan 2 file mới.

- [ ] **Step 4: Commit**

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/common/SearchSelectField.jsx m6-thermal-power-plant/src/components/common/SearchSelectField.css
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: component SearchSelectField - search server-side phan trang 10/trang (single/add mode)"
```

---

### Task 3: `CreateWorkOrderModal.jsx` (trang yeu-cau)

**Files:**
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\repair_request\CreateWorkOrderModal.jsx`

**Interfaces:**
- Consumes: `SearchSelectField` (Task 2), `employeeService.search` (`search: (params) => apiClient.get('/api/v1/employees/search', { params })`), `workOrderService.getBusyEmployees`.
- Produces: giữ nguyên payload Formik (`leaderId, directSupervisorId, safetySupervisorId` là number, `members: [{employeeId, roleInTask}]`), `onCreated(request, workOrder)`.

- [ ] **Step 1: Thêm import + helper**

```jsx
import SearchSelectField from '../common/SearchSelectField';
```

Giữ `employeeService` import (còn dùng cho search). Thêm trước `export default function`:

```jsx
const EMP_KEY = (e) => e.id;
const EMP_LABEL = (e) => `${e.fullName || e.name || 'Unknown'}${e.employeeCode ? ` (${e.employeeCode})` : ''}`;
const EMP_RENDER = (e) => (
  <div>
    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
      {e.fullName || e.name || 'Unknown'}
      <span className="font-mono text-muted ms-2 small">{e.employeeCode}</span>
    </div>
    <div className="text-muted small">
      {[e.position?.name, e.department?.name].filter(Boolean).join(' · ') || '—'}
    </div>
  </div>
);
const searchEmployees = (p) => employeeService.search({
  keyword: p.query || undefined,
  page: p.page,
  size: p.size,
});
```

- [ ] **Step 2: Bỏ `getAllWithAccounts`, giữ `getBusyEmployees`**

Thay toàn bộ `useEffect` tải `accountEmployees` (khối `Promise.all([...])` đầu file) bằng hiệu ứng chỉ tải busy:

```jsx
  useEffect(() => {
    if (!show) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const busyRes = await workOrderService.getBusyEmployees(undefined);
        if (!cancelled) setBusyIds(Array.isArray(busyRes.data) ? busyRes.data : []);
      } catch {
        if (!cancelled) setBusyIds([]);
      }
    })();
    return () => { cancelled = true; };
  }, [show]);
```

- [ ] **Step 3: Xoá `accountEmployees` / `employeeList` / `roleInfoLoaded`**

- Bỏ state `const [accountEmployees, setAccountEmployees] = useState(null);`
- Bỏ `const roleInfoLoaded = accountEmployees !== null;`
- Bỏ toàn bộ `employeeList` useMemo + hàm `getAvailableEmployees` + biến `available`.
- Giữ `busyIds` state (và `const busy = new Set(busyIds);` trong render).
- Roles giờ lấy từ chính item search: `e.account?.roles` — **không** phải `e.roles` (đó là shape của `getAllWithAccounts`, đã bỏ).

- [ ] **Step 4: Thay `optionsFor` bằng `roleFilter`**

Trong render (chỗ `optionsFor` cũ, sau `const busy = new Set(busyIds);`), xoá `optionsFor` và đặt:

```jsx
          const roleFilter = (field) => (list) => list.filter((e) => {
            if (busy.has(e.id)) return false;
            if (field === 'safetySupervisorId') {
              if (roleFieldIds.leaderId === e.id || roleFieldIds.directSupervisorId === e.id) return false;
              const roles = (e.account?.roles || []).map((r) => r?.name || r);
              if (!roles.includes(SAFETY_SUPERVISOR_ROLE)) return false;
            } else if (roleFieldIds.safetySupervisorId === e.id) {
              return false;
            }
            return true;
          });
```

`memberIds` không lọc ở đây nữa — đã đi qua `excludedIds`.

- [ ] **Step 5: Thay 3 `<Field as="select">` vai trò**

Thêm `leaderLabel`, `directSupervisorLabel`, `safetySupervisorLabel` (chuỗi rỗng) vào `initialValues`. Chúng chỉ để hiển thị — `onSubmit` map payload tường minh nên không lọt lên backend.

Thay từng khối `<Field as="select" id="pct-{field}" ...>` + `ErrorMessage` của nó bằng:

```jsx
                    <SearchSelectField
                      label="Người lãnh đạo công việc"
                      required
                      mode="single"
                      searchFn={searchEmployees}
                      getKey={EMP_KEY}
                      renderItem={EMP_RENDER}
                      placeholder="Tìm theo tên, mã NV, phòng ban..."
                      value={values.leaderId || null}
                      onChange={(item) => {
                        setFieldValue('leaderId', item ? item.id : '');
                        setFieldValue('leaderLabel', item ? EMP_LABEL(item) : '');
                      }}
                      selectedLabel={values.leaderLabel}
                      excludedIds={memberIds.concat(values.safetySupervisorId ? [Number(values.safetySupervisorId)] : [])}
                      filterClient={roleFilter('leaderId')}
                      error={touched.leaderId && errors.leaderId}
                    />
```

Tương tự cho `directSupervisorId` (label "Chỉ huy trực tiếp") và `safetySupervisorId` (label "Người giám sát an toàn"):
- `directSupervisorId`: `excludedIds={memberIds.concat(values.safetySupervisorId ? [Number(values.safetySupervisorId)] : [])}`
- `safetySupervisorId`: `excludedIds={memberIds.concat([values.leaderId, values.directSupervisorId].map(Number).filter(Boolean))}`

**Cả 3 `onChange` phải set cả `{field}Id` lẫn `{field}Label`** — chỉ set id thì ô sẽ hiện tên người chọn trước đó.

- [ ] **Step 6: Thay select "Nhiều thành viên" bằng mode add**

Thay toàn bộ `<select ... aria-label="Chọn nhân viên làm việc">...</select>` + nút "Thêm" bằng:

```jsx
                  <SearchSelectField
                    label="Nhiều thành viên"
                    mode="add"
                    searchFn={searchEmployees}
                    getKey={EMP_KEY}
                    renderItem={EMP_RENDER}
                    placeholder="Tìm nhân viên để thêm..."
                    onAdd={(item) => {
                      const id = Number(item.id);
                      if (values.members.some((m) => m.employeeId === id)) {
                        toast.info('Nhân viên đã có trong danh sách');
                        return;
                      }
                      setFieldValue('members', [
                        ...values.members,
                        { employeeId: id, roleInTask: item.position?.name || '', _label: EMP_LABEL(item) },
                      ]);
                    }}
                    excludedIds={memberIds.concat(Object.values(roleFieldIds).filter(Boolean))}
                  />
```

- Xoá state `selectedEmployeeId` (cả dòng `setSelectedEmployeeId('')` trong `onSubmit`) + hàm `addMember`.
- Chip render: thay `employeeList.find((e) => e.id === m.employeeId)` bằng `const name = m._label || \`ID ${m.employeeId}\`;`
- Payload submit giữ nguyên: `.map((m) => ({ employeeId, roleInTask }))` đã bỏ `_label`.

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: sạch. Xoá import thành unused (`useMemo`, `ErrorMessage` nếu không còn dùng); `Field` vẫn dùng cho `startTime` nên giữ.

- [ ] **Step 8: Commit**

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/repair_request/CreateWorkOrderModal.jsx
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: CreateWorkOrderModal - 3 vai tro + nhieu thanh vien thanh SearchSelectField"
```

---

### Task 4: `CreateManualWorkOrderModal.jsx` (trang phieu-cong-tac)

**Files:**
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\work_order\CreateManualWorkOrderModal.jsx`

**Interfaces:**
- Consumes: `SearchSelectField`, `employeeService.search`, `workOrderService.getBusyEmployees`.
- Produces: giữ payload `{equipmentIds | equipmentLines, leaderId, directSupervisorId, safetySupervisorId, startTime, repairDescription, members}`; picker thiết bị KHÔNG đụng tới.

- [ ] **Step 1: Import + helpers**

Giống Task 3 Step 1 (copy nguyên `EMP_KEY`, `EMP_LABEL`, `EMP_RENDER`, `searchEmployees` + import `SearchSelectField`).

- [ ] **Step 2: Bỏ `getAllWithAccounts`** (giữ `getBusyEmployees`)

Thay `Promise.all([employeeService.getAllWithAccounts(), workOrderService.getBusyEmployees(undefined)])` trong effect đầu file bằng chỉ busy (giống Task 3 Step 2). Xoá state `accountEmployees`, `roleInfoLoaded`, `employeeList` useMemo.

- [ ] **Step 3: Thay `optionsFor` bằng `roleFilter`**

Giống Task 3 Step 4 (cùng logic, cùng `SAFETY_SUPERVISOR_ROLE`).

- [ ] **Step 4: Thay 3 `<Field as="select">` vai trò**

Thay khối map `{[{field:'leaderId',...},...].map(...)}` (3 `<Col md={4}>` chứa `<Field as="select">`) bằng 3 `<Col md={4}>` viết rời, mỗi cột một `SearchSelectField` — props y hệt Task 3 Step 5 (nhớ set cả id lẫn label trong `onChange`).

Thêm `leaderLabel: '', directSupervisorLabel: '', safetySupervisorLabel: ''` vào `initialValues`.

- [ ] **Step 5: Thay select "Nhiều thành viên" bằng mode add**

Giống Task 3 Step 6. Xoá state `selectedEmployeeId` + `addMember`. Chip render dùng `m._label`.

- [ ] **Step 6: Lint + commit**

Run: `npm run lint` — sạch. `BsPersonPlus` giờ nằm trong `SearchSelectField`; nếu file này không còn dùng thì xoá khỏi import.

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/work_order/CreateManualWorkOrderModal.jsx
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: CreateManualWorkOrderModal - 3 vai tro + nhieu thanh vien thanh SearchSelectField"
```

---

### Task 5: `WorkOrderEditModal.jsx`

**Files:**
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\work_order\WorkOrderEditModal.jsx`

**Interfaces:**
- Consumes: `SearchSelectField`, `employeeService.search`, `workOrderService.getBusyEmployees(workOrder.id)`.
- Produces: giữ payload `{leaderId, directSupervisorId, safetySupervisorId, startTime, repairDescription}`; `''` → `null` = giữ nguyên.

- [ ] **Step 1: Import + helpers**

Giống Task 3 Step 1, đặt sau `const toLocalInput = ...`.

- [ ] **Step 2: Form state thêm label**

```jsx
  const [form, setForm] = useState(() => (workOrder ? {
    leaderId: workOrder.leaderId ?? '',
    directSupervisorId: workOrder.directSupervisorId ?? '',
    safetySupervisorId: workOrder.safetySupervisorId ?? '',
    leaderLabel: workOrder.leaderName || '',
    directSupervisorLabel: workOrder.directSupervisorName || '',
    safetySupervisorLabel: workOrder.safetySupervisorName || '',
    startTime: toLocalInput(workOrder.startTime),
    repairDescription: workOrder.repairDescription || '',
  } : null));
```

- [ ] **Step 3: Effect — bỏ `getAllWithAccounts`**

```jsx
  useEffect(() => {
    if (!show) return undefined;
    let cancelled = false;
    workOrderService.getBusyEmployees(workOrder.id)
      .then((busyRes) => {
        if (!cancelled) setBusyIds(Array.isArray(busyRes.data) ? busyRes.data : []);
      })
      .catch(() => {
        if (!cancelled) setBusyIds([]);
      });
    return () => { cancelled = true; };
  }, [show, workOrder?.id]);
```

Xoá state `employees`; giữ `busyIds`; giữ import `employeeService` (searchEmployees dùng nó).

- [ ] **Step 4: Thêm `roleFilter`**

Trước `return`, sau `setField`:

```jsx
  const roleFilter = (field) => (list) => list.filter((e) => {
    if (busyIds && busyIds.includes(e.id)) return false;
    if (field === 'safetySupervisorId') {
      if (Number(form.leaderId) === e.id || Number(form.directSupervisorId) === e.id) return false;
      const roles = (e.account?.roles || []).map((r) => r?.name || r);
      if (!roles.includes('SAFETY_SUPERVISOR')) return false;
    } else if (Number(form.safetySupervisorId) === e.id) {
      return false;
    }
    return true;
  });
```

- [ ] **Step 5: Thay 3 `<EmployeeSelect>`**

```jsx
            <SearchSelectField
              label="Người lãnh đạo công việc"
              mode="single"
              emptyLabel="— Giữ nguyên —"
              searchFn={searchEmployees}
              getKey={EMP_KEY}
              renderItem={EMP_RENDER}
              placeholder="Tìm theo tên, mã NV, phòng ban..."
              value={form.leaderId || null}
              onChange={(item) => {
                setField('leaderId', item ? item.id : '');
                setField('leaderLabel', item ? EMP_LABEL(item) : '');
              }}
              selectedLabel={form.leaderLabel}
              excludedIds={form.safetySupervisorId ? [Number(form.safetySupervisorId)] : []}
              filterClient={roleFilter('leaderId')}
            />
```

Tương tự `directSupervisorId` (excludedIds như trên) và `safetySupervisorId` (`excludedIds={[form.leaderId, form.directSupervisorId].map(Number).filter(Boolean)}`).

**Bắt buộc set cả `{field}Label`** — đây là modal sửa, `selectedLabel` khởi tạo từ `workOrder.{field}Name`; nếu `onChange` chỉ set id thì chọn người mới xong ô vẫn hiện tên người cũ.

Nếu `setField` không gộp được 2 lần gọi liên tiếp (state cũ bị ghi đè), đổi sang một lần `setForm((f) => ({ ...f, leaderId: ..., leaderLabel: ... }))`.

- [ ] **Step 6: Xoá component `EmployeeSelect`**

Xoá toàn bộ hàm `EmployeeSelect` ở cuối file (không còn dùng).

- [ ] **Step 7: Lint + commit**

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/work_order/WorkOrderEditModal.jsx
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: WorkOrderEditModal - 3 vai tro thanh SearchSelectField, giu nguyen khi bo chon"
```

---

### Task 6: `WorkOrderDetailModal.jsx` — tab "Thêm thành viên"

**Files:**
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\work_order\WorkOrderDetailModal.jsx`

**Interfaces:**
- Consumes: `SearchSelectField`, `employeeService.search`, `workOrderService.getBusyEmployees(workOrderId)`.
- Produces: giữ `handleAddMember(emp)` (đã nhận item làm tham số, dòng ~209) và `addingEmployeeId`.

- [ ] **Step 1: Import + helpers**

Import `SearchSelectField`; thêm `EMP_KEY`, `EMP_RENDER`, `searchEmployees` (như Task 3 Step 1, không cần `EMP_LABEL`) sau `const MANAGE_MEMBER_ROLES = ...`.

- [ ] **Step 2: Xoá state + effect tải `employees`**

- Xoá: `const [employees, setEmployees] = useState(null);`, `const [employeesLoading, setEmployeesLoading] = useState(false);`, `const [empSearch, setEmpSearch] = useState('');`
- Xoá useEffect tải `employeeService.getAll()` (khối "Tải danh sách nhân viên khi mở tab 'Thêm thành viên'").
- Trong effect `[show, workOrderId, loadDetail]`: xoá `setEmpSearch('')`.
- Xoá useMemo `filteredEmployees`.
- **Giữ** `addingEmployeeId` (dùng cho `pendingKey`) và effect tải `busyIds`.

- [ ] **Step 3: Thêm `addFilter`**

Sau effect tải busyIds:

```jsx
  const addFilter = useCallback((list) => {
    const activeIds = new Set(
      (detail?.currentMembers || []).filter((m) => !m.leftAt).map((m) => m.employeeId)
    );
    const roleIds = new Set(
      [detail?.leaderId, detail?.directSupervisorId, detail?.safetySupervisorId].filter(Boolean)
    );
    const busy = new Set(busyIds || []);
    return list.filter(
      (e) => !activeIds.has(e.id) && !roleIds.has(e.id) && !busy.has(e.id)
    );
  }, [detail, busyIds]);
```

- [ ] **Step 4: Thay block search + list trong tab "add"**

Thay toàn bộ từ `<div className="input-group input-group-sm mb-2">` (ô search có `BsSearch`) đến hết `</div>` đóng `list-group` bằng:

```jsx
                        <SearchSelectField
                          mode="add"
                          searchFn={searchEmployees}
                          getKey={EMP_KEY}
                          renderItem={EMP_RENDER}
                          placeholder="Tìm theo tên, mã NV, phòng ban, chức vụ..."
                          onAdd={handleAddMember}
                          filterClient={addFilter}
                          pendingKey={addingEmployeeId}
                        />
```

Ô "Giờ vào" + form-text phía trên giữ nguyên. Placeholder giữ đủ 4 tiêu chí vì `keyword` ở backend đã OR cả `department.name` và `position.name` (Task 1 Step 2).

Sau khi `handleAddMember` chạy xong, `loadDetail(true)` đổi `detail` → `addFilter` đổi → component lọc lại **lúc render**, người vừa thêm biến mất khỏi panel mà không cần fetch lại.

- [ ] **Step 5: Lint + commit**

Run: `npm run lint` — sạch (bỏ `BsSearch` nếu không còn dùng chỗ khác trong file; `employeeService` VẪN dùng cho `searchEmployees`).

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/work_order/WorkOrderDetailModal.jsx
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: WorkOrderDetailModal - tab them thanh vien dung SearchSelectField search server-side"
```

---

### Task 7: `CreateRequestModal.jsx` — Hệ thống + Thiết bị

**Files:**
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\repair_request\CreateRequestModal.jsx`

**Interfaces:**
- Consumes: `SearchSelectField`; `systemService.getAllSystems(name, status, page, size)` — **thứ tự thật là `(name, status, ...)`**, không phải `(code, name, ...)`; `equipmentService.getAll({ systemId, kw, page, size })` (param `kw` từ Task 1).
- Produces: giữ Formik `{equipmentId, issueDescription, priority}` + validation Yup.

- [ ] **Step 1: Import + helpers**

```jsx
import SearchSelectField from '../common/SearchSelectField';
```

Sau `createRequestSchema`:

```jsx
const SYS_KEY = (s) => s.id;
const SYS_LABEL = (s) => `[${s.code}] ${s.name}`;
const SYS_RENDER = (s) => (
  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
    <span className="font-mono me-1">{s.code}</span>{s.name}
  </div>
);
const EQ_KEY = (e) => e.id;
const EQ_LABEL = (e) => `[${e.kksCode}] ${e.name}`;
const EQ_RENDER = (e) => (
  <div>
    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
      <span className="font-mono me-1">{e.kksCode}</span>{e.name}
    </div>
    {e.equipmentType && <div className="text-muted small">{e.equipmentType}</div>}
  </div>
);
```

Kiểm tên field của `SystemListDTO` (`code` hay `systemCode`) trước khi dùng trong `SYS_LABEL`/`SYS_RENDER`.

- [ ] **Step 2: Xoá state/effect cũ**

Xoá `systems`, `equipments`, `loadingEquipments`, `loadSystems`, `loadEquipments`, effect `[show]`, `handleSystemChange`. Đổi `selectedSystemId` thành:

```jsx
  const [selectedSystem, setSelectedSystem] = useState(null); // {id, label}
  const [eqLabel, setEqLabel] = useState('');
```

- [ ] **Step 3: Thay 2 select**

```jsx
              <Form.Group className="mb-4">
                <Form.Label className="crm-label">Hệ thống</Form.Label>
                <SearchSelectField
                  mode="single"
                  searchFn={(p) => systemService.getAllSystems(p.query, '', p.page, p.size)}
                  getKey={SYS_KEY}
                  renderItem={SYS_RENDER}
                  placeholder="Tìm theo tên hệ thống..."
                  value={selectedSystem ? selectedSystem.id : null}
                  onChange={(item) => {
                    setSelectedSystem(item ? { id: item.id, label: SYS_LABEL(item) } : null);
                    setFieldValue('equipmentId', '');
                    setEqLabel('');
                  }}
                  selectedLabel={selectedSystem?.label}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="crm-label">
                  Thiết bị <span className="text-danger">*</span>
                </Form.Label>
                <SearchSelectField
                  mode="single"
                  searchFn={(p) => equipmentService.getAll({
                    systemId: selectedSystem?.id,
                    kw: p.query || undefined,
                    page: p.page,
                    size: p.size,
                  })}
                  getKey={EQ_KEY}
                  renderItem={EQ_RENDER}
                  placeholder="Tìm theo mã KKS, tên thiết bị..."
                  value={values.equipmentId || null}
                  onChange={(item) => {
                    setFieldValue('equipmentId', item ? item.id : '');
                    setEqLabel(item ? EQ_LABEL(item) : '');
                  }}
                  selectedLabel={eqLabel}
                  error={touched.equipmentId && errors.equipmentId}
                />
              </Form.Group>
```

Ô "Hệ thống" chỉ search theo **tên** — endpoint `/api/v1/systems` không có param `code` (`IEquipmentSystemRepository.java:20`). Ô "Thiết bị" gửi **một** param `kw`, không gửi kèm `kks`/`name` (2 param đó nối AND ở backend).

- [ ] **Step 4: Lint + commit**

Run: `npm run lint` — sạch (`useEffect` bỏ nếu không còn dùng; `BsPlusCircle` vẫn dùng ở header nên giữ).

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/repair_request/CreateRequestModal.jsx
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: CreateRequestModal - select He thong + Thiet bi thanh SearchSelectField"
```

---

### Task 8: Build + E2E toàn bộ

**Files:** không sửa code.

- [ ] **Step 1: Build frontend**

Run (workdir `m6-thermal-power-plant`): `npm run build` → build success (bắt lỗi JSX/import sót).

- [ ] **Step 2: Khởi chạy backend + frontend**

- Backend: `cd D:\smcs\M6_THERMAL_POWER_PLANT_API; .\gradlew.bat bootRun` (hoặc chạy từ IDE).
- Frontend: `npm run dev`.

- [ ] **Step 3: E2E — trang `/repair/yeu-cau`**

1. **CreateRequestModal:** gõ tìm hệ thống theo tên → chọn → gõ **mã KKS** tìm thiết bị → ra kết quả; gõ **tên** thiết bị → cũng ra kết quả (đây là chỗ kiểm param `kw`); chọn → điền mô tả + priority → submit thành công. Đổi hệ thống sau khi đã chọn thiết bị → thiết bị bị reset.
2. **CreateWorkOrderModal:** 3 ô vai trò — gõ theo tên, theo mã NV, theo phòng ban → đều ra kết quả; duyệt ◀ ▶, tổng đúng; chọn → hiện đúng tên người **vừa chọn** + ✕; chọn LĐ rồi mở GSAT → chỉ hiện người có role SAFETY_SUPERVISOR; "Nhiều thành viên" thêm nhiều chip → **người vừa thêm biến mất khỏi panel ngay**, không trùng; submit tạo PCT thành công.

- [ ] **Step 4: E2E — trang `/repair/phieu-cong-tac`**

1. **CreateManualWorkOrderModal:** 3 vai trò + nhiều thành viên như trên; picker thiết bị đa chọn vẫn hoạt động (search KKS + phân trang 10); submit thành công.
2. **WorkOrderEditModal:** chọn người khác → **tên hiển thị đổi theo** → lưu → giá trị đổi; ✕ bỏ chọn → lưu → giá trị giữ nguyên (kiểm lại sau refresh).
3. **WorkOrderDetailModal → tab "Thêm thành viên":** gõ tìm, duyệt trang, bấm Thêm → nút hiện "Đang thêm..." và bị khoá; thành viên xuất hiện trong list "Thành viên" và **biến mất khỏi panel**; double-click không tạo trùng; người bận ở phiếu khác không hiện.
4. Hồi quy: WorkOrderStatusModal (mở/khoá/huỷ) không đổi.

- [ ] **Step 5: Bàn phím + hồi quy API**

- Esc khi panel mở → đóng panel, **không** đóng modal. Esc khi panel đóng → đóng modal như cũ.
- Enter khi panel mở → chọn dòng đầu, **không** submit form.
- Panel không bị `.modal-body` cắt (modal `scrollable`); nếu bị, cuộn modal xuống rồi mở lại panel để xác nhận.
- `GET /api/v1/employees/search?name=an` (trang HR `ListEmployee.jsx`) vẫn trả đúng; mở trang danh sách nhân viên, lọc thử.
- `GET /api/v1/equipments?kks=...` (picker thiết bị cũ) vẫn trả đúng.

---

## Self-Review ghi chú

- **Spec coverage:** mục 3.1+3.2 (backend) → Task 1; mục 4 (component) → Task 2; 5.1→Task 3; 5.2→Task 4; 5.3→Task 5; 5.4→Task 6; 5.5→Task 7; mục 6 (testing) → Task 8. Đầy đủ.
- **Đã verify trên code thật:**
  - `EmployeeService.java:360` gộp predicate bằng `cb.and(...)` → gửi `name` + `code` cùng chuỗi sẽ ra rỗng. Vì thế dùng **một** param `keyword` + `cb.or(...)`.
  - `IEquipmentRepository.java:42-43` nối `AND` → tương tự, dùng **một** param `kw`.
  - `systemService.js:5` là `getAllSystems(name, status, page, size)`; `/api/v1/systems` **không có** param `code`.
  - `EmployeeResponseDTO` có `account.roles` và `mapToResponseDTO` điền đủ → `filterClient` lọc GSAT bằng `e.account?.roles` chạy được.
  - `employeeService.search` chỉ còn 1 caller khác (`ListEmployee.jsx:81`) → thêm param mới an toàn.
  - Backend là **Gradle** (`build.gradle` + `gradlew.bat`, không có `pom.xml`).
  - Frontend không có test runner (`package.json` scripts: dev/build/lint/preview).
- **Type consistency:** `searchFn` nhận `{query, page, size}`, `size` luôn = `PAGE_SIZE` (10) do component đặt. `onChange` nhận `item|null`; các modal map `item.id`/`''`. `filterClient` nhận `list` trả `list`, chạy lúc render. `pendingKey` so bằng `String(...)`.
- **Bỏ có chủ đích:** `e.isActive === false` không lọc gì (DTO trả `isActive` kiểu **String**) → không chép sang code mới. Không lọc theo `isActive` nữa; nếu cần lọc NV nghỉ việc thì làm ở backend, không làm ở client.
- **Giới hạn đã chấp nhận:** `error` chỉ hiện sau lần submit đầu (component không set `touched`); bàn phím mới có Esc/Enter, chưa có ↑↓ + `role="listbox"`; counter hiện tổng server nên có thể lớn hơn số dòng thấy được sau lọc client.
