# SearchSelectField Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyá»ƒn má»i trÆ°á»ng `<select>` trong 5 modal cá»§a 2 trang `/repair/phieu-cong-tac` vÃ  `/repair/yeu-cau` thÃ nh Ã´ search server-side, káº¿t quáº£ phÃ¢n trang 10 pháº§n tá»­/trang.

**Architecture:** Component dÃ¹ng chung `SearchSelectField` (mode `single` chá»n 1 / mode `add` thÃªm vÃ o chip) nháº­n `searchFn` + `filterClient` tá»« modal. Backend thÃªm 1 predicate tÃ¬m theo mÃ£ NV. Má»—i modal giá»¯ nguyÃªn bá»™ lá»c hiá»‡n táº¡i (busy/exclude/role GSAT) báº±ng cÃ¡ch truyá»n xuá»‘ng `filterClient` vÃ  `excludedIds`.

**Tech Stack:** React 19 + react-bootstrap 2.10 + Formik + Yup (frontend, `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant`); Spring Boot (backend, `D:\smcs\M6_THERMAL_POWER_PLANT_API`).

## Global Constraints

- Frontend: `npm run lint` cháº¡y sáº¡ch (eslint 10), `npm run build` pass.
- KhÃ´ng thÃªm dependency má»›i. KhÃ´ng thÃªm comment trá»« khi sá»­a logic hiá»‡n cÃ³ cáº§n giáº£i thÃ­ch.
- KhÃ´ng sá»­a validation Formik/Yup (chá»‰ Ä‘á»•i cÃ¡ch hiá»ƒn thá»‹ error).
- KhÃ´ng sá»­a picker thiáº¿t bá»‹ Ä‘a chá»n trong `CreateManualWorkOrderModal`, radio priority trong `CreateRequestModal`, `WorkOrderStatusModal`.
- Backend: chá»‰ sá»­a 2 file, khÃ´ng Ä‘á»¥ng endpoint cÅ©.
- Repo riÃªng: frontend = `M6_THERMAL_POWER_PLANT`, backend = `M6_THERMAL_POWER_PLANT_API`. Commit riÃªng tá»«ng repo.
- Frontend KHÃ”NG cÃ³ test framework â€” verify báº±ng lint + build + manual E2E (Task 8).

---

### Task 1: Backend â€” search nhÃ¢n viÃªn theo mÃ£ NV

**Files:**
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT_API\src\main\java\com\example\m6_thermal_power_plant_api\dto\employee\EmployeeSearchRequestDTO.java`
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT_API\src\main\java\com\example\m6_thermal_power_plant_api\service\employee\EmployeeService.java` (trong `searchEmployees`, cáº¡nh predicate `name`)

**Interfaces:**
- Produces: `GET /api/v1/employees/search?code=...&name=...&page=...&size=...` â†’ `Page<EmployeeResponseDTO>` (`content, totalElements, totalPages, number`), má»—i pháº§n tá»­ cÃ³ `id, employeeCode, fullName, department{name}, position{name}, isActive, account{roles:[{name}]}`. Task 2â€“7 tiÃªu thá»¥ endpoint nÃ y.

- [ ] **Step 1: ThÃªm field `code` vÃ o DTO**

Trong `EmployeeSearchRequestDTO.java`, sau field `isActive`:

```java
    private String code;
```

- [ ] **Step 2: ThÃªm predicate trong `searchEmployees`**

Trong `EmployeeService.java` (method `searchEmployees`, ngay sau khá»‘i `if (searchRequest.getName() != null ...)`):

```java
            if (searchRequest.getCode() != null && !searchRequest.getCode().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("employeeCode")), "%" + searchRequest.getCode().trim().toLowerCase() + "%"));
            }
```

- [ ] **Step 3: BiÃªn dá»‹ch backend**

Run (workdir `D:\smcs\M6_THERMAL_POWER_PLANT_API`): `mvn -q compile`
Expected: BUILD SUCCESS, khÃ´ng lá»—i.

- [ ] **Step 4: Commit backend**

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT_API" add src/main/java/com/example/m6_thermal_power_plant_api/dto/employee/EmployeeSearchRequestDTO.java src/main/java/com/example/m6_thermal_power_plant_api/service/employee/EmployeeService.java
git -C "D:\smcs\M6_THERMAL_POWER_PLANT_API" commit -m "feat: search employee theo ma NV (code) trong /employees/search"
```

---

### Task 2: Component `SearchSelectField`

**Files:**
- Create: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\common\SearchSelectField.jsx`
- Create: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\common\SearchSelectField.css`

**Interfaces:**
- Consumes: `searchFn` tráº£ vá» Promise resolve `{ data: { content, totalElements, totalPages, number } }` (chuáº©n axios + Spring Page).
- Produces (Task 3â€“7 tiÃªu thá»¥):

```
Props:
  label: string                    // nhÃ£n
  required?: boolean               // dáº¥u *
  placeholder?: string             // gá»£i Ã½ Ã´ search (máº·c Ä‘á»‹nh 'TÃ¬m kiáº¿m...')
  emptyLabel?: string              // text khi chÆ°a chá»n (vd 'â€” Giá»¯ nguyÃªn â€”'); placeholder náº¿u bá» trá»‘ng
  mode: 'single' | 'add'
  searchFn: (p: {query, page, size}) => Promise   // size luÃ´n 10
  filterClient?: (list) => list    // lá»c sau khi nháº­n tá»« server (busy/role...)
  getKey: (item) => string|number
  renderItem: (item) => ReactNode
  value?: string|number|null       // single: id Ä‘ang chá»n ('' hoáº·c null = chÆ°a chá»n)
  onChange?: (item|null) => void   // single: item chá»n Ä‘Æ°á»£c / null khi bá» chá»n
  selectedLabel?: string           // single: text hiá»ƒn thá»‹ khi Ä‘Ã£ chá»n (modal tá»± quáº£n lÃ½)
  excludedIds?: Array<string|number>  // loáº¡i khá»i káº¿t quáº£
  onAdd?: (item) => void           // add: thÃªm vÃ o chip (modal quáº£n lÃ½ list)
  error?: string                   // text lá»—i Formik
```

- [ ] **Step 1: Viáº¿t component**

```jsx
import { useEffect, useRef, useState } from 'react';
import { Pagination } from 'react-bootstrap';
import { BsSearch, BsXCircle, BsPersonPlus } from 'react-icons/bs';
import './SearchSelectField.css';

const PAGE_SIZE = 10;

export default function SearchSelectField({
  label, required, placeholder = 'TÃ¬m kiáº¿m...', emptyLabel,
  mode = 'single', searchFn, filterClient, getKey, renderItem,
  value, onChange, selectedLabel, excludedIds = [], onAdd, error,
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [items, setItems] = useState(null); // null = chÆ°a táº£i láº§n Ä‘áº§u
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // excludedIds/filterClient/searchFn Ä‘á»•i identity má»—i render (modal inline) â€”
  // giá»¯ ref Ä‘á»ƒ effect fetch khÃ´ng láº·p vÃ´ háº¡n; Ä‘á»c giÃ¡ trá»‹ má»›i nháº¥t khi fetch.
  const excludeRef = useRef(excludedIds);
  const filterRef = useRef(filterClient);
  const searchRef = useRef(searchFn);
  useEffect(() => { excludeRef.current = excludedIds; });
  useEffect(() => { filterRef.current = filterClient; });
  useEffect(() => { searchRef.current = searchFn; });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchRef.current({ query, page, size: PAGE_SIZE });
        const d = res.data || res;
        const content = Array.isArray(d.content) ? d.content : [];
        const exclude = new Set(excludeRef.current.map((x) => String(x)));
        let list = content.filter((it) => !exclude.has(String(getKey(it))));
        if (filterRef.current) list = filterRef.current(list);
        setItems(list);
        setTotalElements(d.totalElements ?? list.length);
        setTotalPages(d.totalPages ?? 1);
      } catch {
        setItems([]);
        setTotalElements(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); setLoading(false); };
  }, [open, query, page, getKey]);

  useEffect(() => {
    const onClick = (ev) => {
      if (rootRef.current && !rootRef.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const clear = () => {
    onChange?.(null);
    setOpen(false);
    setQuery('');
    setPage(0);
  };

  const hasValue = mode === 'single' && value != null && value !== '';
  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="ssf" ref={rootRef}>
      {label && (
        <label className="ssf-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {hasValue ? (
        <div className="ssf-selected">
          <span className="ssf-selected-text">{selectedLabel || emptyLabel || placeholder}</span>
          <button type="button" className="ssf-clear" onClick={clear} title="Bá» chá»n">
            <BsXCircle />
          </button>
        </div>
      ) : (
        <div className="input-group input-group-sm">
          <span className="input-group-text"><BsSearch /></span>
          <input
            type="text"
            className="form-control"
            placeholder={emptyLabel || placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setPage(0); setOpen(true); }}
          />
        </div>
      )}

      {open && !hasValue && (
        <div className="ssf-panel">
          {loading && items === null ? (
            <div className="ssf-empty">Äang táº£i...</div>
          ) : !items || items.length === 0 ? (
            <div className="ssf-empty">KhÃ´ng tÃ¬m tháº¥y</div>
          ) : (
            <>
              <div className="ssf-list">
                {items.map((it) => (
                  <div key={getKey(it)} className="ssf-item">
                    <div className="ssf-item-content">{renderItem(it)}</div>
                    {mode === 'add' ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onAdd?.(it)}
                      >
                        <BsPersonPlus /> ThÃªm
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => { onChange?.(it); setOpen(false); }}
                      >
                        Chá»n
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="ssf-footer">
                <span className="ssf-count">{from}â€“{to} / {totalElements} káº¿t quáº£</span>
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

- [ ] **Step 2: Viáº¿t CSS**

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
  max-height: 340px; overflow-y: auto;
}
.ssf-empty { padding: 0.75rem; text-align: center; color: var(--text-tertiary); font-size: var(--text-sm); }
.ssf-list { padding: 0.25rem; }
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

Ghi chÃº: náº¿u `--color-surface` chÆ°a tá»“n táº¡i, dÃ¹ng `#fff` (dark mode) â€” kiá»ƒm tra `src/index.css` biáº¿n CSS hiá»‡n cÃ³; Æ°u tiÃªn dÃ¹ng biáº¿n Ä‘Ã£ tá»“n táº¡i, bá»• sung biáº¿n má»›i chá»‰ khi thiáº¿u.

- [ ] **Step 3: Lint**

Run (workdir `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant`): `npm run lint`
Expected: khÃ´ng lá»—i liÃªn quan 2 file má»›i.

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
- Consumes: `SearchSelectField` (Task 2), `employeeService.search` (Ä‘Ã£ cÃ³ sáºµn: `search: (params) => apiClient.get('/api/v1/employees/search', { params })`), `workOrderService.getBusyEmployees`.
- Produces: giá»¯ nguyÃªn payload Formik (`leaderId, directSupervisorId, safetySupervisorId` lÃ  number, `members: [{employeeId, roleInTask}]`), `onCreated(request, workOrder)`.

- [ ] **Step 1: ThÃªm import + háº±ng sá»‘**

ThÃªm Ä‘áº§u file:

```jsx
import SearchSelectField from '../common/SearchSelectField';
```

Giá»¯ `employeeService` import (cÃ²n dÃ¹ng cho search). ThÃªm helper dÃ¹ng chung trong file (trÆ°á»›c `export default function`):

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
      {[e.position?.name, e.department?.name].filter(Boolean).join(' Â· ') || 'â€”'}
    </div>
  </div>
);
const searchEmployees = (p) => employeeService.search({
  name: p.query || undefined,
  code: p.query || undefined,
  page: p.page,
  size: p.size,
});
```

- [ ] **Step 2: Bá» `getAllWithAccounts`, giá»¯ `getBusyEmployees`**

Thay toÃ n bá»™ `useEffect` táº£i `accountEmployees` (khá»‘i `Promise.all([...])` Ä‘áº§u file, Ä‘áº·t `accountEmployees`/`setAccountEmployees`) báº±ng hiá»‡u á»©ng chá»‰ táº£i busy:

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

- [ ] **Step 3: XoÃ¡ `accountEmployees`/`employeeList`/`roleInfoLoaded`**

- Bá» state `const [accountEmployees, setAccountEmployees] = useState(null);`
- Bá» `const roleInfoLoaded = accountEmployees !== null;`
- Bá» toÃ n bá»™ `employeeList` useMemo + hÃ m `getAvailableEmployees`.
- Giá»¯ `busyIds` state.
- Ghi chÃº: roles giá» láº¥y tá»« chÃ­nh item search (`e.account?.roles`).

- [ ] **Step 4: Thay 3 `<Field as="select">` vai trÃ²**

Trong JSX, thay tá»«ng khá»‘i `<Field as="select" id="pct-{field}" ...>...</Field>` (leaderId, directSupervisorId, safetySupervisorId) báº±ng:

```jsx
                    <SearchSelectField
                      label="NgÆ°á»i lÃ£nh Ä‘áº¡o cÃ´ng viá»‡c"
                      required
                      mode="single"
                      searchFn={searchEmployees}
                      getKey={EMP_KEY}
                      renderItem={EMP_RENDER}
                      placeholder="TÃ¬m theo tÃªn, mÃ£ NV..."
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

TÆ°Æ¡ng tá»± cho `directSupervisorId` (label "Chá»‰ huy trá»±c tiáº¿p") vÃ  `safetySupervisorId` (label "NgÆ°á»i giÃ¡m sÃ¡t an toÃ n"):
- `directSupervisorId`: `excludedIds={memberIds.concat(values.safetySupervisorId ? [Number(values.safetySupervisorId)] : [])}`
- `safetySupervisorId`: `excludedIds={memberIds.concat([values.leaderId, values.directSupervisorId].map(Number).filter(Boolean))}`

ThÃªm `leaderLabel`, `directSupervisorLabel`, `safetySupervisorLabel` vÃ o `initialValues` (chuá»—i rá»—ng `''`).

Äá»‹nh nghÄ©a `roleFilter` trong render (trÆ°á»›c `return`, ngay sau khá»‘i `optionsFor` cÅ© â€” thay `optionsFor` báº±ng hÃ m nÃ y):

```jsx
          const roleFilter = (field) => (list) => list.filter((e) => {
            if (e.isActive === false) return false;
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

XoÃ¡ khá»‘i `optionsFor` cÅ©. XoÃ¡ khá»‘i JSX cÅ© `{optionsFor('leaderId').map(...)}` v.v. (cáº£ 3 `<Field as="select">` vÃ  `ErrorMessage` cá»§a chÃºng â€” error Ä‘Ã£ náº±m trong prop `error`).

- [ ] **Step 5: Thay select "Nhiá»u thÃ nh viÃªn" báº±ng mode add**

Thay toÃ n bá»™ `<select ... aria-label="Chá»n nhÃ¢n viÃªn lÃ m viá»‡c">...</select>` + nÃºt "ThÃªm" báº±ng:

```jsx
                  <SearchSelectField
                    label="Nhiá»u thÃ nh viÃªn"
                    mode="add"
                    searchFn={searchEmployees}
                    getKey={EMP_KEY}
                    renderItem={EMP_RENDER}
                    placeholder="TÃ¬m tÃªn nhÃ¢n viÃªn Ä‘á»ƒ thÃªm..."
                    onAdd={(item) => {
                      const id = Number(item.id);
                      if (values.members.some((m) => m.employeeId === id)) {
                        toast.info('NhÃ¢n viÃªn Ä‘Ã£ cÃ³ trong danh sÃ¡ch');
                        return;
                      }
                      setFieldValue('members', [
                        ...values.members,
                        { employeeId: id, roleInTask: item.position?.name || '' },
                      ]);
                    }}
                    excludedIds={memberIds.concat(Object.values(roleFieldIds).filter(Boolean))}
                    filterClient={(list) => list.filter((e) => e.isActive !== false)}
                  />
```

- XoÃ¡ state `selectedEmployeeId` + `addMember` function (logic Ä‘Ã£ vÃ o `onAdd`).
- Sá»­a chip render: thay `employeeList.find((e) => e.id === m.employeeId)` báº±ng lookup tá»« `roleFieldIds` + members Ä‘Ã£ lÆ°u. Äá»ƒ Ä‘Æ¡n giáº£n, giá»¯ chip hiá»ƒn thá»‹ báº±ng cÃ¡ch lÆ°u label ngay trong members khi thÃªm â€” Ä‘á»•i `onAdd` thÃ nh:

```jsx
                      setFieldValue('members', [
                        ...values.members,
                        { employeeId: id, roleInTask: item.position?.name || '', _label: EMP_LABEL(item) },
                      ]);
```

vÃ  chip render dÃ¹ng `m._label`:

```jsx
                        const name = m._label || `ID ${m.employeeId}`;
```

Payload submit giá»¯ nguyÃªn (map chá»‰ láº¥y `employeeId` + `roleInTask` â€” field `_label` bá»‹ bá» qua vÃ¬ backend DTO ignore).

- [ ] **Step 6: Lint**

Run (workdir `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant`): `npm run lint`
Expected: sáº¡ch (náº¿u `useMemo`/`Row`/`Col` thÃ nh unused â†’ xoÃ¡ khá»i import; `Field` váº«n dÃ¹ng cho startTime nÃªn giá»¯).

- [ ] **Step 7: Commit**

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
- Produces: giá»¯ payload `{equipmentIds | equipmentLines, leaderId, directSupervisorId, safetySupervisorId, startTime, repairDescription, members}`; picker thiáº¿t bá»‹ KHÃ”NG Ä‘á»¥ng tá»›i.

- [ ] **Step 1: Import + helpers**

```jsx
import SearchSelectField from '../common/SearchSelectField';
```

ThÃªm trÆ°á»›c `export default function` (giá»‘ng Task 3 Step 1):

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
      {[e.position?.name, e.department?.name].filter(Boolean).join(' Â· ') || 'â€”'}
    </div>
  </div>
);
const searchEmployees = (p) => employeeService.search({
  name: p.query || undefined,
  code: p.query || undefined,
  page: p.page,
  size: p.size,
});
```

- [ ] **Step 2: Bá» `getAllWithAccounts`** (giá»¯ `getBusyEmployees`)

Thay `Promise.all([employeeService.getAllWithAccounts(), workOrderService.getBusyEmployees(undefined)])` trong effect Ä‘áº§u file báº±ng chá»‰ busy (giá»‘ng Task 3 Step 2). XoÃ¡ state `accountEmployees`, `roleInfoLoaded`, `employeeList` useMemo.

- [ ] **Step 3: Thay 3 `<Field as="select">` vai trÃ²**

Thay khá»‘i map `{[{field:'leaderId',...},...].map(({field,label}) => (...))}` (3 `<Col md={4}>` chá»©a `<Field as="select">`) báº±ng 3 `<Col md={4}>` riÃªng:

```jsx
                  <Col md={4}>
                    <SearchSelectField
                      label="NgÆ°á»i lÃ£nh Ä‘áº¡o cÃ´ng viá»‡c"
                      required
                      mode="single"
                      searchFn={searchEmployees}
                      getKey={EMP_KEY}
                      renderItem={EMP_RENDER}
                      placeholder="TÃ¬m theo tÃªn, mÃ£ NV..."
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
                  </Col>
                  <Col md={4}>
                    <SearchSelectField
                      label="Chá»‰ huy trá»±c tiáº¿p"
                      required
                      mode="single"
                      searchFn={searchEmployees}
                      getKey={EMP_KEY}
                      renderItem={EMP_RENDER}
                      placeholder="TÃ¬m theo tÃªn, mÃ£ NV..."
                      value={values.directSupervisorId || null}
                      onChange={(item) => {
                        setFieldValue('directSupervisorId', item ? item.id : '');
                        setFieldValue('directSupervisorLabel', item ? EMP_LABEL(item) : '');
                      }}
                      selectedLabel={values.directSupervisorLabel}
                      excludedIds={memberIds.concat(values.safetySupervisorId ? [Number(values.safetySupervisorId)] : [])}
                      filterClient={roleFilter('directSupervisorId')}
                      error={touched.directSupervisorId && errors.directSupervisorId}
                    />
                  </Col>
                  <Col md={4}>
                    <SearchSelectField
                      label="NgÆ°á»i giÃ¡m sÃ¡t an toÃ n"
                      required
                      mode="single"
                      searchFn={searchEmployees}
                      getKey={EMP_KEY}
                      renderItem={EMP_RENDER}
                      placeholder="TÃ¬m theo tÃªn, mÃ£ NV..."
                      value={values.safetySupervisorId || null}
                      onChange={(item) => {
                        setFieldValue('safetySupervisorId', item ? item.id : '');
                        setFieldValue('safetySupervisorLabel', item ? EMP_LABEL(item) : '');
                      }}
                      selectedLabel={values.safetySupervisorLabel}
                      excludedIds={memberIds.concat([values.leaderId, values.directSupervisorId].map(Number).filter(Boolean))}
                      filterClient={roleFilter('safetySupervisorId')}
                      error={touched.safetySupervisorId && errors.safetySupervisorId}
                    />
                  </Col>
```

ThÃªm 3 field label vÃ o `initialValues` (`leaderLabel: '', directSupervisorLabel: '', safetySupervisorLabel: ''`).

Thay `optionsFor` cÅ© báº±ng:

```jsx
          const roleFilter = (field) => (list) => list.filter((e) => {
            if (e.isActive === false) return false;
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

- [ ] **Step 4: Thay select "Nhiá»u thÃ nh viÃªn" báº±ng mode add**

Thay `<select ... aria-label="Chá»n nhÃ¢n viÃªn lÃ m viá»‡c">...</select>` + nÃºt "ThÃªm" báº±ng:

```jsx
                  <SearchSelectField
                    label="Nhiá»u thÃ nh viÃªn"
                    mode="add"
                    searchFn={searchEmployees}
                    getKey={EMP_KEY}
                    renderItem={EMP_RENDER}
                    placeholder="TÃ¬m tÃªn nhÃ¢n viÃªn Ä‘á»ƒ thÃªm..."
                    onAdd={(item) => {
                      const id = Number(item.id);
                      if (values.members.some((m) => m.employeeId === id)) {
                        toast.info('NhÃ¢n viÃªn Ä‘Ã£ cÃ³ trong danh sÃ¡ch');
                        return;
                      }
                      setFieldValue('members', [
                        ...values.members,
                        { employeeId: id, roleInTask: item.position?.name || '', _label: EMP_LABEL(item) },
                      ]);
                    }}
                    excludedIds={memberIds.concat(Object.values(roleFieldIds).filter(Boolean))}
                    filterClient={(list) => list.filter((e) => e.isActive !== false)}
                  />
```

- XoÃ¡ state `selectedEmployeeId` + `addMember`.
- Chip render: `const name = m._label || \`ID ${m.employeeId}\`;` (bá» `employeeList.find`).

- [ ] **Step 5: Lint + commit**

Run: `npm run lint` (workdir `m6-thermal-power-plant`) â€” sáº¡ch; xoÃ¡ import unused (`BsPersonPlus` náº¿u khÃ´ng cÃ²n dÃ¹ng... váº«n dÃ¹ng trong component? Component cÃ³ icon riÃªng â€” kiá»ƒm tra, xoÃ¡ náº¿u unused).

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
- Produces: giá»¯ payload `{leaderId, directSupervisorId, safetySupervisorId, startTime, repairDescription}`; `''` â†’ `null` = giá»¯ nguyÃªn.

- [ ] **Step 1: Import + helpers**

```jsx
import SearchSelectField from '../common/SearchSelectField';
```

Sau `const toLocalInput = ...`:

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
      {[e.position?.name, e.department?.name].filter(Boolean).join(' Â· ') || 'â€”'}
    </div>
  </div>
);
const searchEmployees = (p) => employeeService.search({
  name: p.query || undefined,
  code: p.query || undefined,
  page: p.page,
  size: p.size,
});
```

- [ ] **Step 2: Form state thÃªm label**

`useState` initializer thÃªm 3 label tá»« dÃ²ng workOrder:

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

- [ ] **Step 3: Effect â€” bá» `getAllWithAccounts`**

Trong effect, thay `Promise.all([employeeService.getAllWithAccounts(), workOrderService.getBusyEmployees(workOrder.id)])` báº±ng chá»‰ busy:

```jsx
  useEffect(() => {
    if (!show) return;
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

XoÃ¡ state `employees`; `busyIds` giá»¯. XoÃ¡ `employeeService.getAllWithAccounts` khá»i import náº¿u `employeeService` chá»‰ dÃ¹ng cho search â€” giá»¯ `employeeService` (searchEmployees dÃ¹ng nÃ³).

- [ ] **Step 4: Thay 3 `<EmployeeSelect>`**

Thay cáº£ 3 `<EmployeeSelect ... />` báº±ng:

```jsx
            <SearchSelectField
              label="NgÆ°á»i lÃ£nh Ä‘áº¡o cÃ´ng viá»‡c"
              mode="single"
              emptyLabel="â€” Giá»¯ nguyÃªn â€”"
              searchFn={searchEmployees}
              getKey={EMP_KEY}
              renderItem={EMP_RENDER}
              placeholder="TÃ¬m theo tÃªn, mÃ£ NV..."
              value={form.leaderId || null}
              onChange={(item) => setField('leaderId', item ? item.id : '')}
              selectedLabel={form.leaderLabel}
              excludedIds={form.safetySupervisorId ? [Number(form.safetySupervisorId)] : []}
              filterClient={roleFilter('leaderId')}
            />
            <SearchSelectField
              label="Chá»‰ huy trá»±c tiáº¿p"
              mode="single"
              emptyLabel="â€” Giá»¯ nguyÃªn â€”"
              searchFn={searchEmployees}
              getKey={EMP_KEY}
              renderItem={EMP_RENDER}
              placeholder="TÃ¬m theo tÃªn, mÃ£ NV..."
              value={form.directSupervisorId || null}
              onChange={(item) => setField('directSupervisorId', item ? item.id : '')}
              selectedLabel={form.directSupervisorLabel}
              excludedIds={form.safetySupervisorId ? [Number(form.safetySupervisorId)] : []}
              filterClient={roleFilter('directSupervisorId')}
            />
            <SearchSelectField
              label="NgÆ°á»i giÃ¡m sÃ¡t an toÃ n"
              mode="single"
              emptyLabel="â€” Giá»¯ nguyÃªn â€”"
              searchFn={searchEmployees}
              getKey={EMP_KEY}
              renderItem={EMP_RENDER}
              placeholder="TÃ¬m theo tÃªn, mÃ£ NV..."
              value={form.safetySupervisorId || null}
              onChange={(item) => setField('safetySupervisorId', item ? item.id : '')}
              selectedLabel={form.safetySupervisorLabel}
              excludedIds={[form.leaderId, form.directSupervisorId].map(Number).filter(Boolean)}
              filterClient={roleFilter('safetySupervisorId')}
            />
```

Ghi chÃº: `onChange` bá» chá»n (`null`) â†’ `''` â†’ submit gá»­i `null` â†’ backend giá»¯ nguyÃªn. Khi item Ä‘Æ°á»£c chá»n mÃ  label cÅ© khÃ´ng cÃ³ tÃªn (trÆ°á»ng há»£p data cÅ©) â€” `setField` giá»¯ label; náº¿u muá»‘n cáº­p nháº­t label, má»Ÿ rá»™ng `onChange`: `(item) => { setField('leaderId', item ? item.id : ''); setField('leaderLabel', item ? EMP_LABEL(item) : ''); }`.

ThÃªm `roleFilter` (trÆ°á»›c `return`, sau `setField`):

```jsx
  const roleFilter = (field) => (list) => list.filter((e) => {
    if (e.isActive === false) return false;
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

- [ ] **Step 5: XoÃ¡ component `EmployeeSelect`**

XoÃ¡ toÃ n bá»™ hÃ m `EmployeeSelect` á»Ÿ cuá»‘i file (khÃ´ng cÃ²n dÃ¹ng).

- [ ] **Step 6: Lint + commit**

Run: `npm run lint` â€” sáº¡ch (bá» import unused).

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/work_order/WorkOrderEditModal.jsx
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: WorkOrderEditModal - 3 vai tro thanh SearchSelectField, giu nguyen khi bo chon"
```

---

### Task 6: `WorkOrderDetailModal.jsx` â€” tab "ThÃªm thÃ nh viÃªn"

**Files:**
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\work_order\WorkOrderDetailModal.jsx`

**Interfaces:**
- Consumes: `SearchSelectField`, `employeeService.search`, `workOrderService.getBusyEmployees(workOrderId)`.
- Produces: giá»¯ `handleAddMember(emp)` (Ä‘Ã£ cÃ³) â€” nháº­n item search lÃ m tham sá»‘.

- [ ] **Step 1: Import + helpers**

```jsx
import SearchSelectField from '../common/SearchSelectField';
```

Sau `const MANAGE_MEMBER_ROLES = ...`:

```jsx
const EMP_KEY = (e) => e.id;
const EMP_RENDER = (e) => (
  <div>
    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
      {e.fullName || e.name || 'Unknown'}
      <span className="font-mono text-muted ms-2 small">{e.employeeCode}</span>
    </div>
    <div className="text-muted small">
      {[e.position?.name, e.department?.name].filter(Boolean).join(' Â· ') || 'â€”'}
    </div>
  </div>
);
const searchEmployees = (p) => employeeService.search({
  name: p.query || undefined,
  code: p.query || undefined,
  page: p.page,
  size: p.size,
});
```

- [ ] **Step 2: XoÃ¡ state + effect táº£i `employees`**

- XoÃ¡: `const [employees, setEmployees] = useState(null);`, `const [employeesLoading, setEmployeesLoading] = useState(false);`, `const [empSearch, setEmpSearch] = useState('');`
- XoÃ¡ useEffect táº£i `employeeService.getAll()` (khá»‘i "Táº£i danh sÃ¡ch nhÃ¢n viÃªn khi má»Ÿ tab 'ThÃªm thÃ nh viÃªn'").
- Trong effect `[show, workOrderId, loadDetail]`: xoÃ¡ `setEmpSearch('')`.
- XoÃ¡ useMemo `filteredEmployees` (logic dá»i vÃ o `addFilter` Step 3).
- Giá»¯ effect táº£i `busyIds`.

- [ ] **Step 3: Thay block search + list trong tab "add"**

Thay toÃ n bá»™ tá»« `<div className="input-group input-group-sm mb-2">` (Ã´ search cÃ³ `BsSearch`) Ä‘áº¿n háº¿t `</div>` Ä‘Ã³ng `list-group` (trÆ°á»›c `</Tab>`) báº±ng:

```jsx
                        <SearchSelectField
                          label=""
                          mode="add"
                          searchFn={searchEmployees}
                          getKey={EMP_KEY}
                          renderItem={EMP_RENDER}
                          placeholder="TÃ¬m theo tÃªn, mÃ£ NV..."
                          onAdd={handleAddMember}
                          filterClient={addFilter}
                        />
```

ThÃªm `addFilter` (useCallback, sau effect táº£i busyIds):

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
      (e) => e.isActive !== false && !activeIds.has(e.id) && !roleIds.has(e.id) && !busy.has(e.id)
    );
  }, [detail, busyIds]);
```

- [ ] **Step 4: Lint + commit**

Run: `npm run lint` â€” sáº¡ch (bá» import unused: `BsSearch` náº¿u khÃ´ng cÃ²n dÃ¹ng, `employeeService` VáºªN cÃ²n dÃ¹ng cho searchEmployees).

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/work_order/WorkOrderDetailModal.jsx
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: WorkOrderDetailModal - tab them thanh vien dung SearchSelectField search server-side"
```

---

### Task 7: `CreateRequestModal.jsx` â€” Há»‡ thá»‘ng + Thiáº¿t bá»‹

**Files:**
- Modify: `D:\smcs\M6_THERMAL_POWER_PLANT\m6-thermal-power-plant\src\components\repair_request\CreateRequestModal.jsx`

**Interfaces:**
- Consumes: `SearchSelectField`, `systemService.getAllSystems(code, name, page, size)`, `equipmentService.getAll({systemId, kks, name, page, size})`.
- Produces: giá»¯ Formik `{equipmentId, issueDescription, priority}` + validation Yup.

- [ ] **Step 1: Import + helpers**

```jsx
import SearchSelectField from '../common/SearchSelectField';
```

Sau `createRequestSchema`:

```jsx
const SYS_KEY = (s) => s.id;
const SYS_LABEL = (s) => `[${s.code}] ${s.name}`;
const SYS_RENDER = (s) => (
  <div>
    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
      <span className="font-mono me-1">{s.code}</span>{s.name}
    </div>
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

- [ ] **Step 2: XoÃ¡ state/effect cÅ©**

XoÃ¡: `systems`, `equipments`, `loadingEquipments` state; `loadSystems`, `loadEquipments`; effect `[show]`; `handleSystemChange` (thay báº±ng logic trong JSX Step 3). Giá»¯ `selectedSystemId` â€” Ä‘á»•i thÃ nh:

```jsx
  const [selectedSystem, setSelectedSystem] = useState(null); // {id, label}
```

- [ ] **Step 3: Thay 2 select**

Trong Formik render (dÃ¹ng `values, errors, touched, setFieldValue` â€” váº«n cÃ³ sáºµn), thay 2 `Form.Group` "Há»‡ thá»‘ng" vÃ  "Thiáº¿t bá»‹" báº±ng:

```jsx
              <Form.Group className="mb-4">
                <Form.Label className="crm-label">Há»‡ thá»‘ng</Form.Label>
                <SearchSelectField
                  label=""
                  mode="single"
                  searchFn={(p) => systemService.getAllSystems(p.query, '', p.page, p.size)}
                  getKey={SYS_KEY}
                  renderItem={SYS_RENDER}
                  placeholder="TÃ¬m theo mÃ£, tÃªn há»‡ thá»‘ng..."
                  value={selectedSystem ? selectedSystem.id : null}
                  onChange={(item) => {
                    setSelectedSystem(item ? { id: item.id, label: SYS_LABEL(item) } : null);
                    setFieldValue('equipmentId', '');
                    setEqLabel('');
                  }}
                  selectedLabel={selectedSystem?.label}
                  error={undefined}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="crm-label">
                  Thiáº¿t bá»‹ <span className="text-danger">*</span>
                </Form.Label>
                <SearchSelectField
                  label=""
                  mode="single"
                  searchFn={(p) => equipmentService.getAll({
                    systemId: selectedSystem?.id,
                    kks: p.query || undefined,
                    name: p.query || undefined,
                    page: p.page,
                    size: p.size,
                  })}
                  getKey={EQ_KEY}
                  renderItem={EQ_RENDER}
                  placeholder="TÃ¬m theo mÃ£ KKS, tÃªn thiáº¿t bá»‹..."
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

ThÃªm state: `const [eqLabel, setEqLabel] = useState('');`

- [ ] **Step 4: Lint + commit**

Run: `npm run lint` â€” sáº¡ch (xoÃ¡ import unused: `BsPlusCircle` váº«n dÃ¹ng á»Ÿ header â€” giá»¯; `useEffect` bá» náº¿u khÃ´ng cÃ²n dÃ¹ng).

```bash
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" add m6-thermal-power-plant/src/components/repair_request/CreateRequestModal.jsx
git -C "D:\smcs\M6_THERMAL_POWER_PLANT" commit -m "feat: CreateRequestModal - select He thong + Thiet bi thanh SearchSelectField"
```

---

### Task 8: Build + E2E toÃ n bá»™

**Files:** khÃ´ng sá»­a code.

- [ ] **Step 1: Build frontend**

Run (workdir `m6-thermal-power-plant`): `npm run build`
Expected: build success (catch lá»—i JSX/import sÃ³t).

- [ ] **Step 2: Khá»Ÿi cháº¡y backend + frontend**

- Backend: cháº¡y Spring Boot app (IDE hoáº·c `mvn spring-boot:run`).
- Frontend: `npm run dev`.

- [ ] **Step 3: E2E â€” trang `/repair/yeu-cau`**

1. Táº¡o yÃªu cáº§u (CreateRequestModal): gÃµ tÃ¬m há»‡ thá»‘ng â†’ chá»n â†’ gÃµ KKS/tÃªn tÃ¬m thiáº¿t bá»‹ â†’ chá»n â†’ Ä‘iá»n mÃ´ táº£ + priority â†’ submit thÃ nh cÃ´ng. Äá»•i há»‡ thá»‘ng sau khi Ä‘Ã£ chá»n thiáº¿t bá»‹ â†’ thiáº¿t bá»‹ bá»‹ reset, pháº£i chá»n láº¡i.
2. Táº¡o PCT tá»« request (CreateWorkOrderModal): 3 Ã´ vai trÃ² â€” gÃµ tÃ¬m theo tÃªn VÃ€ theo mÃ£ NV, duyá»‡t â—€ â–¶ (Ä‘áº¿m "xâ€“y / z káº¿t quáº£" Ä‘Ãºng), chá»n â†’ hiá»‡n selectedLabel + âœ•; chá»n LÄ rá»“i GSAT â†’ LÄ khÃ´ng xuáº¥t hiá»‡n trong GSAT náº¿u khÃ´ng cÃ³ role SAFETY_SUPERVISOR; "Nhiá»u thÃ nh viÃªn" thÃªm nhiá»u chip â†’ khÃ´ng trÃ¹ng; submit táº¡o PCT thÃ nh cÃ´ng.

- [ ] **Step 4: E2E â€” trang `/repair/phieu-cong-tac`**

1. Táº¡o PCT thá»§ cÃ´ng (CreateManualWorkOrderModal): 3 vai trÃ² + nhiá»u thÃ nh viÃªn nhÆ° trÃªn; picker thiáº¿t bá»‹ váº«n hoáº¡t Ä‘á»™ng (search KKS + phÃ¢n trang 10); submit thÃ nh cÃ´ng.
2. Sá»­a phiáº¿u (WorkOrderEditModal): chá»n ngÆ°á»i khÃ¡c â†’ lÆ°u â†’ giÃ¡ trá»‹ Ä‘á»•i; âœ• bá» chá»n â†’ lÆ°u â†’ giÃ¡ trá»‹ giá»¯ nguyÃªn (kiá»ƒm tra DB/UI sau refresh).
3. Chi tiáº¿t phiáº¿u â†’ tab "ThÃªm thÃ nh viÃªn": gÃµ tÃ¬m, duyá»‡t trang, ThÃªm â†’ thÃ nh viÃªn xuáº¥t hiá»‡n trong list "ThÃ nh viÃªn"; ngÆ°á»i Ä‘Ã£ thÃªm khÃ´ng cÃ²n xuáº¥t hiá»‡n khi thÃªm tiáº¿p; ngÆ°á»i báº­n á»Ÿ phiáº¿u khÃ¡c khÃ´ng hiá»‡n.
4. Há»“i quy: WorkOrderStatusModal (má»Ÿ/khoÃ¡/huá»·) khÃ´ng Ä‘á»•i.

- [ ] **Step 5: Há»“i quy search API**

`GET /api/v1/employees/search?name=an` vÃ  `?code=NV001` Ä‘á»u tráº£ Ä‘Ãºng; khÃ´ng cÃ³ param â†’ tráº£ page Ä‘áº§u.

---

## Self-Review ghi chÃº

- **Spec coverage:** má»¥c 3 (backend) â†’ Task 1; má»¥c 4 (component) â†’ Task 2; má»¥c 5.1â†’Task 3; 5.2â†’Task 4; 5.3â†’Task 5; 5.4â†’Task 6; 5.5â†’Task 7; má»¥c 6 (testing) â†’ Task 8. Äáº§y Ä‘á»§.
- **Type consistency:** `searchFn` nháº­n `{query, page, size}` â€” `size` luÃ´n 10 (háº±ng `PAGE_SIZE` trong component, modal khÃ´ng tá»± Ä‘áº·t). `onChange` nháº­n `item|null`; cÃ¡c modal map `item.id`/`''`. `filterClient` nháº­n `list` tráº£ `list`. `e.account?.roles` nháº¥t quÃ¡n giá»¯a 3 modal PCT.
- **LÆ°u Ã½ triá»ƒn khai:** `getAllSystems` signature lÃ  `(code, name, page, size)` â€” Task 7 truyá»n Ä‘Ãºng thá»© tá»±. `ListEquipmentDTO` cÃ³ `kksCode, name, equipmentType` (Ä‘Ã£ dÃ¹ng á»Ÿ CreateManualWorkOrderModal). Náº¿u modal cÃ²n dÆ° import unused â†’ eslint bÃ¡o, xoÃ¡ theo bÃ¡o lá»—i.
