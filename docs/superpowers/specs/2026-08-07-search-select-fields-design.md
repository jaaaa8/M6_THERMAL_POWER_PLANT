# SearchSelectField — Chuyển trường option thành ô search + phân trang 10/trang

**Ngày:** 2026-08-07 (sửa sau review 2026-08-07)
**Phạm vi:** Modal thêm/chỉnh sửa ở trang `/repair/phieu-cong-tac` và `/repair/yeu-cau` (frontend `M6_THERMAL_POWER_PLANT/m6-thermal-power-plant` + backend `M6_THERMAL_POWER_PLANT_API`).

## 1. Mục tiêu

Thay tất cả trường `<select>` (option) trong các modal tạo mới / chỉnh sửa của 2 trang trên bằng ô tìm kiếm có kết quả **phân trang 10 phần tử/trang** (nút ◀ ▶ + "Tổng z kết quả · Trang p/n"). Search **server-side** (debounce 300ms, gọi API mỗi lần gõ).

## 2. Phạm vi trường chuyển đổi

| Modal | Trường | Mode |
|---|---|---|
| `CreateWorkOrderModal.jsx` (yeu-cau) | LĐ công việc, Chỉ huy trực tiếp, GSAT | single |
| `CreateWorkOrderModal.jsx` (yeu-cau) | Nhiều thành viên | add |
| `CreateManualWorkOrderModal.jsx` (phieu-cong-tac) | LĐ, Chỉ huy, GSAT | single |
| `CreateManualWorkOrderModal.jsx` (phieu-cong-tac) | Nhiều thành viên | add |
| `WorkOrderEditModal.jsx` (phieu-cong-tac) | LĐ, Chỉ huy, GSAT | single |
| `WorkOrderDetailModal.jsx` (phieu-cong-tac) | Tab "Thêm thành viên" | add |
| `CreateRequestModal.jsx` (yeu-cau) | Hệ thống | single |
| `CreateRequestModal.jsx` (yeu-cau) | Thiết bị | single |

**Giữ nguyên:** radio "Mức độ ưu tiên" (CreateRequestModal), picker thiết bị đa chọn trong CreateManualWorkOrderModal (đã là search + 10/trang), WorkOrderStatusModal (không có select), mọi select ngoài modal (filter trên trang).

## 3. Backend (M6_THERMAL_POWER_PLANT_API)

> **Đã verify:** predicate của `searchEmployees` gộp bằng `cb.and(...)` (`EmployeeService.java:360`) và native query thiết bị nối `AND` (`IEquipmentRepository.java:42-43`). Nếu frontend gửi cùng một chuỗi vào 2 param (`name` + `code`, hoặc `kks` + `name`) thì kết quả **luôn rỗng**. Vì vậy mỗi endpoint nhận **một** param tự do, backend tự OR.

### 3.1 Nhân viên — param `keyword` (OR)

**`dto/employee/EmployeeSearchRequestDTO.java`** — thêm field:

```java
private String keyword;
```

**`service/employee/EmployeeService.java`** — trong `searchEmployees`, thêm cạnh predicate `name` hiện có (giữ nguyên `name`, `phone`, `gmail`, `departmentId`, `isActive` để `ListEmployee.jsx:81` — caller duy nhất còn lại — không vỡ):

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

Phòng ban + chức vụ nằm trong OR để giữ đúng năng lực search hiện có của `WorkOrderDetailModal` ("Tìm theo tên, mã NV, phòng ban, chức vụ...").

Endpoint không đổi: `GET /api/v1/employees/search?keyword=...&page=&size=` → `Page<EmployeeResponseDTO>`, mỗi phần tử có `id, employeeCode, fullName, department{name}, position{name}, isActive, account{roles:[{name}]}` (verify tại `EmployeeResponseDTO.java` + `EmployeeService.mapToResponseDTO`).

### 3.2 Thiết bị — param `kw` (OR kks/tên)

`GET /api/v1/equipments` hiện có `systemId, kks, name, typeId, status` nối bằng `AND`. Thêm **một** param mới `kw`, không đụng param cũ.

**`repository/equipment/IEquipmentRepository.java`** — thêm vào **cả** query chính và `countQuery`:

```sql
AND (:kw IS NULL OR e.kks_code LIKE CONCAT('%',:kw,'%') OR e.name LIKE CONCAT('%',:kw,'%'))
```

và `@Param("kw") String kw` vào signature `getEquipment(...)`.

**`service/equipment/IEquipmentService.java` + `EquipmentService.java` + `controller/equipment/EquipmentController.java`** — luồng param `kw` đi xuyên qua (`@RequestParam(required = false) String kw`).

Caller cũ truyền `kw = null` → hành vi không đổi.

### 3.3 Hệ thống — không sửa backend

`GET /api/v1/systems` nhận `name, status, page, size` (`EquipmentSystemController.java:26-29`), repo chỉ lọc `s.name` (`IEquipmentSystemRepository.java:20`) — **không có `code`**. Frontend `systemService.getAllSystems(name, status, page, size)`.

→ Ô "Hệ thống" chỉ search theo **tên**, placeholder ghi đúng như vậy. (Muốn search theo mã phải sửa thêm repo + service + controller — nằm ngoài phạm vi đợt này.)

## 4. Component mới — `src/components/common/SearchSelectField.jsx` (+ `.css`)

### Props

| Prop | Bắt buộc | Mô tả |
|---|---|---|
| `label` | không | Nhãn trường. Bỏ trống → modal tự render `<Form.Label>` bên ngoài |
| `required` | không | Hiện dấu `*` |
| `placeholder` | không | Gợi ý ô search |
| `mode` | có | `'single'` hoặc `'add'` |
| `searchFn` | có | `(params: { query, page, size }) => Promise<axiosRes>` — modal tự viết, quyết định endpoint + tham số phụ (vd `systemId`), trả về Spring `Page` (`{ content, totalElements, totalPages }`) |
| `filterClient` | không | `(items) => items` — lọc busy/exclude/role. Chạy **lúc render**, không phải lúc fetch |
| `getKey` | có | `(item) => string\|number` |
| `renderItem` | có | `(item) => ReactNode` — nội dung dòng kết quả |
| `value` | mode single | id đang chọn |
| `onChange` | mode single | `(item \| null) => void` — `null` khi bỏ chọn |
| `selectedLabel` | mode single | Text hiển thị khi đã chọn (vd "Nguyễn Văn A (NV001)") |
| `emptyLabel` | không | Text khi chưa chọn (vd "— Giữ nguyên —" ở modal sửa). Mặc định: `placeholder` |
| `excludedIds` | không | Array id loại khỏi kết quả (đã chọn ở trường khác, thành viên đã thêm) |
| `onAdd` | mode add | `(item) => void` — thêm vào list chip (modal quản lý list) |
| `pendingKey` | không | mode add: key của item đang gọi API → nút hiện "Đang thêm..." + `disabled` (chống double-click) |
| `error` | không | Text lỗi validation (từ Formik) |

### Hành vi

- **Chưa chọn:** ô input search. Focus hoặc gõ → fetch `searchFn({ query, page: 0, size: 10 })` sau debounce 300ms → panel kết quả dạng list, mỗi trang **10 phần tử**, nút ◀ ▶ + "Tổng z kết quả · Trang p/n". Gõ query mới → reset về trang 0.
- **Đã chọn (single):** hiện `selectedLabel` + nút ✕ → `onChange(null)`.
- **Lọc lúc render (KHÔNG lúc fetch):** giữ nguyên `content` thô từ server trong state; mỗi lần render mới áp `excludedIds` → `filterClient`. Nhờ vậy thêm 1 thành viên là người đó **biến mất khỏi panel ngay**, không cần fetch lại. Trang có thể < 10 phần tử; lọc sạch → "Không tìm thấy".
- **Counter** hiển thị tổng của **server** (`totalElements`) — không hiển thị dải `x–y` vì lọc client làm dải này sai.
- Chọn xong đóng panel; bấm ra ngoài đóng; **Esc** đóng panel (native listener trên root div + `stopPropagation` để Esc không đóng luôn cả `<Modal>`); **Enter** chọn dòng đầu tiên (`preventDefault` để không submit form Formik).
- **Mode add:** mỗi dòng kết quả có nút "Thêm" → `onAdd(item)`; chip list do modal quản lý; `pendingKey` khoá nút đang xử lý.
- Không tải lại khi panel đóng (`open` false → không fetch). Request đang bay bị bỏ qua bằng cờ `cancelled` trong cleanup (tránh response cũ ghi đè khi đổi trang nhanh).

### Giới hạn đã biết (chấp nhận)

- **`error` chỉ hiện sau lần submit đầu.** Component không gọi `setFieldTouched`, nên `touched[field]` chỉ được Formik bật khi submit. Các trường này đều `required` và được validate lúc submit → chấp nhận được. Nâng cấp: thêm prop `onTouch` gọi khi panel đóng.
- Bàn phím ở mức tối thiểu (Esc/Enter), chưa có ↑↓ + `role="listbox"`.
- Panel là `position: absolute`; modal dùng `scrollable` (`.modal-body{overflow-y:auto}`) có thể cắt panel khi panel dài — kiểm ở E2E.

## 5. Tích hợp từng modal

Helper dùng chung trong mỗi modal (module-level, để identity ổn định):

```jsx
const EMP_KEY = (e) => e.id;
const EMP_LABEL = (e) => `${e.fullName || e.name || 'Unknown'}${e.employeeCode ? ` (${e.employeeCode})` : ''}`;
const searchEmployees = (p) => employeeService.search({ keyword: p.query || undefined, page: p.page, size: p.size });
```

### 5.1 `CreateWorkOrderModal.jsx` (trang yeu-cau)

- Thay 3 `<Field as="select">` (leaderId, directSupervisorId, safetySupervisorId) → `<SearchSelectField mode="single">`:
  - `searchFn`: `searchEmployees`
  - `filterClient`: logic `optionsFor` hiện tại — bỏ người bận (busyIds), GSAT: khác LĐ/chỉ huy + chỉ người có role `SAFETY_SUPERVISOR`. Roles đọc từ `e.account?.roles` (shape của `/employees/search`), **không phải** `e.roles` (shape của `getAllWithAccounts`).
  - `excludedIds`: 2 vai trò còn lại + memberIds
  - `onChange`: set cả `{field}Id` **và** `{field}Label` (label để render `selectedLabel`); `error`: `touched[field] && errors[field]`
- "Nhiều thành viên": `<SearchSelectField mode="add">` — `excludedIds` = memberIds + 3 vai trò; `filterClient` chỉ loại đã chọn (không loại busy — giữ hành vi hiện tại); `onAdd` = logic `addMember` (roleInTask = position); bỏ state `selectedEmployeeId`.
- Chip list `pct-nv-list` giữ nguyên; chip đọc `m._label` lưu lúc thêm. `_label` không lọt payload vì `onSubmit` map tường minh (`CreateWorkOrderModal.jsx:172-175`).

### 5.2 `CreateManualWorkOrderModal.jsx` (trang phieu-cong-tac)

Giống hệt 5.1 cho 3 vai trò + Nhiều thành viên. Picker thiết bị giữ nguyên.

### 5.3 `WorkOrderEditModal.jsx`

- Thay component `EmployeeSelect` → `<SearchSelectField mode="single">` (3 lần):
  - `emptyLabel="— Giữ nguyên —"`; bỏ chọn (✕) → `''` → submit gửi `null` (giữ nguyên giá trị cũ — đúng semantics hiện tại)
  - `onChange` **bắt buộc set cả id lẫn label**, nếu không UI sẽ hiện tên người cũ sau khi chọn người mới
  - `filterClient`: bỏ busy (busyIds từ `getBusyEmployees(workOrder.id)` đã loại chính phiếu sẵn), exclude chéo GSAT, GSAT: roleRequired
  - `excludedIds`: vai trò khác đã chọn (trừ leader == directSupervisor, giữ logic hiện tại)
- Xoá component `EmployeeSelect` và state `employees`. **Giữ `busyIds`** — filterClient vẫn cần để lọc người bận.

### 5.4 `WorkOrderDetailModal.jsx` — tab "Thêm thành viên"

- Thay block ô search + list hiện tại (client filter, `.slice(0, 30)`) → `<SearchSelectField mode="add">`:
  - `searchFn`: `searchEmployees` (keyword đã cover tên/mã/phòng ban/chức vụ nhờ §3.1)
  - `filterClient`: bỏ activeIds (đang trong phiếu), roleIds (leader/directSupervisor/safetySupervisor của phiếu), busyIds — giữ nguyên logic hiện tại
  - `onAdd` = `handleAddMember` (đã nhận `emp` làm tham số, `WorkOrderDetailModal.jsx:209`)
  - `pendingKey` = `addingEmployeeId` (giữ state hiện có)
- Ô "Giờ vào" + form-text giữ nguyên phía trên.

### 5.5 `CreateRequestModal.jsx`

- "Hệ thống": `<SearchSelectField mode="single">`, `searchFn: (p) => systemService.getAllSystems(p.query, '', p.page, p.size)` — thứ tự param thật là `(name, status, page, size)`. Placeholder: "Tìm theo tên hệ thống...".
- "Thiết bị": `<SearchSelectField mode="single">`, `searchFn: (p) => equipmentService.getAll({ systemId: selectedSystem?.id, kw: p.query || undefined, page: p.page, size: p.size })` — **một** param `kw`, không gửi kèm `kks`/`name`.
- Chọn hệ thống mới → reset `equipmentId` về `''` (giữ logic `handleSystemChange`).
- Bỏ state/select cũ: `systems`, `equipments`, `loadingEquipments`, `loadSystems`, `loadEquipments`.
- Priority radio giữ nguyên; validation `equipmentId` Yup giữ nguyên, hiển thị qua `error` prop.

## 6. Testing

**Backend** (Gradle — repo **không có** `pom.xml`):

- `cd M6_THERMAL_POWER_PLANT_API; .\gradlew.bat compileJava` → BUILD SUCCESSFUL
- `.\gradlew.bat test` → baseline **89 tests, 20 failed** (H2 trong `AccountSearchServiceDbTest` / `DepartmentSearchServiceDbTest` / `EmployeeSearchServiceDbTest`). Failure thứ 21 là do mình.
- Chạy app (`.\gradlew.bat bootRun`), gọi:
  - `GET /api/v1/employees/search?keyword=NV001&page=0&size=10` → ra đúng nhân viên
  - `GET /api/v1/employees/search?keyword=nguyen` → ra theo tên
  - `GET /api/v1/employees/search?name=nguyen` → vẫn chạy (trang HR không vỡ)
  - `GET /api/v1/equipments?kw=bom&page=0&size=10` và `?kw=KKS01` → cả 2 ra kết quả
  - `GET /api/v1/equipments?kks=KKS01` → vẫn chạy như cũ

**Frontend:** `npm run lint`, `npm run build`, rồi `npm run dev`, mở cả 5 modal, kiểm tra:

1. Gõ tìm ra kết quả (tên **và** mã NV **và** phòng ban/chức vụ), duyệt ◀ ▶ 10/trang, tổng đúng
2. Chọn → hiện selectedLabel, ✕ → bỏ chọn; 3 vai trò không trùng nhau; GSAT chỉ hiện người role SAFETY_SUPERVISOR
3. Nhiều thành viên: thêm chip → **người vừa thêm biến mất khỏi panel ngay** (không cần gõ lại); không trùng; xoá chip; submit tạo PCT thành công
4. Edit modal: chọn khác → **tên hiển thị đổi theo** → lưu đổi; ✕ (giữ nguyên) → lưu giữ giá trị cũ
5. Detail modal: thêm thành viên → member list + busy loại trừ đúng; nút "Đang thêm..." khoá, double-click không tạo trùng
6. CreateRequestModal: chọn hệ thống → thiết bị lọc đúng; gõ **tên** thiết bị ra kết quả (không chỉ KKS); tạo yêu cầu thành công
7. Esc đóng panel mà **không** đóng modal; Enter chọn dòng đầu mà **không** submit form
8. Hồi quy: tạo PCT từ request, tạo PCT thủ công, picker thiết bị đa chọn, WorkOrderStatusModal

## 7. Files

**Frontend:**
- `src/components/common/SearchSelectField.jsx` (mới)
- `src/components/common/SearchSelectField.css` (mới)
- `src/components/repair_request/CreateWorkOrderModal.jsx`
- `src/components/repair_request/CreateRequestModal.jsx`
- `src/components/work_order/CreateManualWorkOrderModal.jsx`
- `src/components/work_order/WorkOrderEditModal.jsx`
- `src/components/work_order/WorkOrderDetailModal.jsx`

**Backend:**
- `dto/employee/EmployeeSearchRequestDTO.java`
- `service/employee/EmployeeService.java`
- `repository/equipment/IEquipmentRepository.java`
- `service/equipment/IEquipmentService.java`
- `service/equipment/EquipmentService.java`
- `controller/equipment/EquipmentController.java`

## 8. Điểm chấp nhận (đã thống nhất với user)

- Phân trang **10 phần tử/trang** (ban đầu yêu cầu 1, đã đính chính).
- Search server-side dùng API có sẵn; backend được phép thêm param search (`keyword` cho NV, `kw` cho thiết bị) — **6 file**, không đổi hành vi param cũ.
- Trang kết quả có thể < 10 sau lọc client (busy/exclude/role) — chấp nhận; counter hiện tổng server.
- Search hệ thống **chỉ theo tên** (không theo mã) — không mở rộng backend systems đợt này.
- `error` validation chỉ hiện sau lần submit đầu.
