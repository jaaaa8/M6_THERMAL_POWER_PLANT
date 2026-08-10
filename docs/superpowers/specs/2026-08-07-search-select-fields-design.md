# SearchSelectField — Chuyển trường option thành ô search + phân trang 10/trang

**Ngày:** 2026-08-07
**Phạm vi:** Modal thêm/chỉnh sửa ở trang `/repair/phieu-cong-tac` và `/repair/yeu-cau` (frontend `M6_THERMAL_POWER_PLANT/m6-thermal-power-plant` + backend `M6_THERMAL_POWER_PLANT_API`).

## 1. Mục tiêu

Thay tất cả trường `<select>` (option) trong các modal tạo mới / chỉnh sửa của 2 trang trên bằng ô tìm kiếm có kết quả **phân trang 10 phần tử/trang** (nút ◀ ▶ + "x–y / z kết quả"). Search **server-side** (debounce 300ms, gọi API mỗi lần gõ).

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

**`dto/employee/EmployeeSearchRequestDTO.java`:** thêm field

```java
private String code;
```

**`service/employee/EmployeeService.java`** — `searchEmployees`: thêm predicate (cạnh predicate `name` hiện có):

```java
if (searchRequest.getCode() != null && !searchRequest.getCode().trim().isEmpty()) {
    predicates.add(cb.like(cb.lower(root.get("employeeCode")), "%" + searchRequest.getCode().trim().toLowerCase() + "%"));
}
```

Không sửa gì cho equipment/system — endpoint sẵn có:
- `GET /api/v1/equipments?systemId&kks&name&page&size` → `Page<ListEquipmentDTO>`
- `GET /api/v1/systems?code&name&page&size` (`getAllSystems(code, name, page, size)`)

## 4. Component mới — `src/components/common/SearchSelectField.jsx` (+ `.css`)

### Props

| Prop | Bắt buộc | Mô tả |
|---|---|---|
| `label` | có | Nhãn trường |
| `required` | không | Hiện dấu `*` |
| `placeholder` | không | Gợi ý ô search |
| `mode` | có | `'single'` hoặc `'add'` |
| `searchFn` | có | `(params: { query, page, size }) => Promise<Page>` — modal tự viết, quyết định endpoint + tham số phụ (vd `systemId`), trả về `{ content, totalElements, totalPages, number }` (Spring Page) |
| `filterClient` | không | `(items) => items` — lọc busy/exclude/role sau khi nhận kết quả server |
| `getKey` | có | `(item) => string\|number` |
| `renderItem` | có | `(item) => ReactNode` — nội dung dòng kết quả |
| `value` | mode single | id đang chọn |
| `onChange` | mode single | `(id: string\|number) => void` — `''` khi bỏ chọn |
| `selectedLabel` | mode single | Text hiển thị khi đã chọn (vd "Nguyễn Văn A (NV001)") |
| `emptyLabel` | không | Text khi chưa chọn (vd "— Giữ nguyên —" ở modal sửa). Mặc định: `placeholder` |
| `excludedIds` | không | `Set/Array` id loại khỏi kết quả (đã chọn ở trường khác, thành viên đã thêm) |
| `onAdd` | mode add | `(item) => void` — thêm vào list chip (modal quản lý list) |
| `error` | không | Text lỗi validation (từ Formik) |

### Hành vi

- **Chưa chọn:** ô input search. Focus hoặc gõ → fetch `searchFn({ query, page: 0, size: 10 })` sau debounce 300ms → panel kết quả dạng list, mỗi trang **10 phần tử**, nút ◀ ▶ + "x–y / z kết quả". Gõ query mới → reset về trang 0.
- **Đã chọn (single):** hiện `selectedLabel` + nút ✕ → `onChange('')`.
- **Lọc sau khi nhận dữ liệu:** áp `excludedIds` rồi `filterClient` → trang có thể < 10 phần tử; lọc sạch → "Không tìm thấy".
- Chọn xong đóng panel; bấm ra ngoài đóng.
- **Mode add:** mỗi dòng kết quả có nút "Thêm" → `onAdd(item)`; chip list do modal quản lý.
- Không tải lại khi modal không mở (`show` false → không fetch).

## 5. Tích hợp từng modal

### 5.1 `CreateWorkOrderModal.jsx` (trang yeu-cau)

- Thay 3 `<Field as="select">` (leaderId, directSupervisorId, safetySupervisorId) → `<SearchSelectField mode="single">`:
  - `searchFn`: `(p) => employeeService.search({ name: p.query, code: p.query, page: p.page, size: 10 })`
  - `filterClient`: logic `optionsFor` hiện tại — bỏ người bận (busyIds), memberIds, GSAT: khác LĐ/chỉ huy + chỉ người có role `SAFETY_SUPERVISOR` (khi `roleInfoLoaded`)
  - `excludedIds`: 2 vai trò còn lại + memberIds
  - `onChange`: `setFieldValue(field, v)`; `error`: từ Formik (`touched[field] && errors[field]`)
- "Nhiều thành viên": `<SearchSelectField mode="add">` — `excludedIds` = memberIds + 3 vai trò; `filterClient` chỉ loại đã chọn (không loại busy — giữ hành vi hiện tại); `onAdd` = logic `addMember` (roleInTask = position); bỏ state `selectedEmployeeId`.
- Chip list `pct-nv-list` giữ nguyên.

### 5.2 `CreateManualWorkOrderModal.jsx` (trang phieu-cong-tac)

Giống hệt 5.1 cho 3 vai trò + Nhiều thành viên. Picker thiết bị giữ nguyên.

### 5.3 `WorkOrderEditModal.jsx`

- Thay component `EmployeeSelect` → `<SearchSelectField mode="single">` (3 lần):
  - `emptyLabel="— Giữ nguyên —"`; bỏ chọn (✕) → `''` → submit gửi `null` (giữ nguyên giá trị cũ — đúng semantics hiện tại)
  - `searchFn` như 5.1
  - `filterClient`: bỏ busy (busyIds từ `getBusyEmployees(workOrder.id)` đã loại chính phiếu sẵn), exclude chéo GSAT, GSAT: roleRequired
  - `excludedIds`: vai trò khác đã chọn (trừ leader == directSupervisor, giữ logic hiện tại)
- Xoá component `EmployeeSelect` và state `employees` (danh sách full không còn dùng — thay bằng search). **Giữ `busyIds`** — filterClient vẫn cần để lọc người bận.

### 5.4 `WorkOrderDetailModal.jsx` — tab "Thêm thành viên"

- Thay block ô search + list hiện tại (client filter, `.slice(0, 30)`) → `<SearchSelectField mode="add">`:
  - `searchFn`: `(p) => employeeService.search({ name: p.query, code: p.query, page: p.page, size: 10 })`
  - `filterClient`: bỏ activeIds (đang trong phiếu), roleIds (leader/directSupervisor/safetySupervisor của phiếu), busyIds — giữ nguyên logic hiện tại
  - `onAdd` = `handleAddMember` (gọi `addMember`, sau đó `loadDetail(true)` để làm mới list thành viên)
- Ô "Giờ vào" + form-text giữ nguyên phía trên.

### 5.5 `CreateRequestModal.jsx`

- "Hệ thống": `<SearchSelectField mode="single">`, `searchFn: (p) => systemService.getAllSystems(p.query, '', p.page, 10)`
- "Thiết bị": `<SearchSelectField mode="single">`, `searchFn: (p) => equipmentService.getAll({ systemId: selectedSystemId || undefined, kks: p.query, name: p.query, page: p.page, size: 10 })`
- Chọn hệ thống mới → reset `equipmentId` về `''` (giữ logic `handleSystemChange`).
- Bỏ state/select cũ: `systems`, `equipments`, `loadingEquipments`, `loadSystems`, `loadEquipments` (nếu không còn dùng).
- Priority radio giữ nguyên; validation `equipmentId` Yup giữ nguyên, hiển thị qua `error` prop.

## 6. Testing

**Backend:** khởi chạy API, gọi
- `GET /api/v1/employees/search?code=NV001&page=0&size=10` → trả đúng nhân viên
- `GET /api/v1/employees/search?name=...` → vẫn chạy (không phá vỡ)

**Frontend:** `npm run dev`, mở cả 5 modal, kiểm tra:
1. Gõ tìm ra kết quả (tên + mã NV), duyệt ◀ ▶ 10/trang, counter đúng
2. Chọn → hiện selectedLabel, ✕ → bỏ chọn; 3 vai trò không trùng nhau; GSAT chỉ hiện người role SAFETY_SUPERVISOR
3. Nhiều thành viên: thêm nhiều chip, không trùng, xoá chip, submit tạo PCT thành công
4. Edit modal: chọn khác → lưu đổi; ✕ (giữ nguyên) → lưu giữ giá trị cũ
5. Detail modal: thêm thành viên → member list + busy loại trừ đúng
6. CreateRequestModal: chọn hệ thống → thiết bị lọc đúng; tạo yêu cầu thành công
7. Hồi quy: tạo PCT từ request, tạo PCT thủ công, submit giữ nguyên validation Formik

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

## 8. Điểm chấp nhận (đã thống nhất với user)

- Phân trang **10 phần tử/trang** (ban đầu yêu cầu 1, đã đính chính).
- Search server-side dùng API có sẵn; backend sửa thêm search theo mã NV (được phép).
- Trang kết quả có thể < 10 sau lọc client (busy/exclude/role) — chấp nhận.
