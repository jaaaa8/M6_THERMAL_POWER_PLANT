# CHANGELOG — Dự án SCMS

## [2026-06-27] — Chốt lại bộ 9 role thực tế của nhà máy

### Bối cảnh
Bản refactor trước tôi tự suy ra 12 role (thêm DIRECTOR, DEPARTMENT_HEAD, SUPERVISOR, TECHNICIAN, MANAGER, STAFF). User đính chính: hệ thống thực tế **chỉ có 9 role**, có phân biệt rõ "Quản đốc PX vận hành" vs "Quản đốc sửa chữa", và "Trưởng ca" vs "Trưởng kíp" (trước đó gộp).

### Bộ role chính thức (xem docs/ROLE_CODES.md)
`ADMIN`, `HR_STAFF`, `MATERIAL_KEEPER`, `TOOL_KEEPER`, `OPERATIONS_MANAGER`, `SHIFT_LEADER`, `WATCH_LEADER`, `REPAIR_MANAGER`, `TEAM_LEADER`.

### Các file đã sửa
| File | Mô tả |
|---|---|
| `docs/ROLE_CODES.md` | Viết lại với 9 role + ma trận quyền tương ứng |
| `src/services/roleService.js` | `SYSTEM_ROLES` rút từ 12 → 9; `initPermissions.rules` viết lại theo 9 role; `readCreateOnly` set chung cho SHIFT_LEADER + WATCH_LEADER |
| `src/services/authService.js` | `LEGACY_ROLE_MAP` chỉ còn `TRUONG_CA → SHIFT_LEADER`; các role BE cũ khác không map (cần BE seed lại) |
| `src/pages/LoginPage.jsx` | `ROLE_REDIRECT` rút từ 12 → 9 entry |
| `src/pages/RepairRequestPage.jsx` | `APPROVER_ROLES` `['ADMIN','MANAGER']` → `['ADMIN','REPAIR_MANAGER']`; `PCT_CREATOR_ROLES` cập nhật tương tự |

### Lưu ý
- BE cần seed lại 9 role này; các role cũ (NHAN_VIEN, KY_THUAT_VIEN, GIAM_SAT, TRUONG_PHONG, GIAM_DOC) cần migrate/xoá.
- Memory `feedback-code-language.md` đã cập nhật bộ 9 role để các phiên sau dùng đúng.

---

## [2026-06-27] — Chuẩn hoá code sang tiếng Anh (route, role, biến)

### Bối cảnh
User yêu cầu "code clean" — chỉ giữ tiếng Việt cho text hiển thị, còn lại (route, biến, mã role, mã chức năng, file) đều EN. User sẽ tự cập nhật BE để khớp bộ role mới. Rule đã lưu vào auto-memory để các phiên sau tuân thủ.

### Routes đổi (slug VN → EN)
| Cũ | Mới |
|---|---|
| `/admin/phan-quyen` | `/admin/roles` |
| `/nhan-su/phong-ban` | `/hr/departments` |
| `/nhan-su/nhan-vien` | `/hr/employees` |
| `/nhan-su/them-moi` | `/hr/employees/new` |
| `/nhan-su/tai-khoan` | `/hr/accounts` |
| `/thiet-bi/he-thong` | `/equipment/systems` |
| `/thiet-bi/danh-sach` | `/equipment` |
| `/sua-chua/yeu-cau` | `/repair/requests` |
| `/sua-chua/phieu-cong-tac[/:id]` | `/repair/work-orders[/:id]` |
| `/sua-chua/danh-gia-kt` | `/repair/assessments` |
| `/vat-tu/danh-muc` | `/materials` |
| `/vat-tu/nhap-xuat` | `/materials/transactions` |
| `/ccdc/danh-sach` | `/tools` |
| `/ccdc/muon-tra` | `/tools/borrowings` |
| `/bao-duong/ke-hoach` | `/maintenance/plans` |
| `/bao-duong/lich-su` | `/maintenance/history` |

### Bộ mã role thống nhất (EN — BE cần seed lại)
Chi tiết đầy đủ: [`docs/ROLE_CODES.md`](./ROLE_CODES.md). Tóm tắt mapping cũ → mới:
`TRUONG_CA → SHIFT_LEADER`, `NHAN_VIEN → STAFF`, `KY_THUAT_VIEN → TECHNICIAN`, `GIAM_SAT → SUPERVISOR`, `TRUONG_PHONG → DEPARTMENT_HEAD`, `GIAM_DOC → DIRECTOR`. Thêm role mới: `HR_STAFF`, `MATERIAL_KEEPER`, `TOOL_KEEPER`, `MANAGER`, `TEAM_LEADER`, `DIRECTOR`. `authService.normalizeUser()` có `LEGACY_ROLE_MAP` bridge code cũ BE → code mới — xoá khi BE đã update.

### Bộ mã featureCode đổi (Vietnamese → English)
`PHONG_BAN→DEPARTMENT`, `NHAN_SU→EMPLOYEE`, `TAI_KHOAN→ACCOUNT`, `HE_THONG→EQUIPMENT_SYSTEM`, `THIET_BI→EQUIPMENT`, `YEU_CAU_SC→REPAIR_REQUEST`, `PHIEU_CT→WORK_ORDER`, `DANH_GIA_KT→TECHNICAL_ASSESSMENT`, `VAT_TU→MATERIAL`, `CCDC→TOOL`, `BAO_DUONG→MAINTENANCE`. Action codes thống nhất EN: `VIEW/CREATE/UPDATE/DELETE` (sửa luôn bug VIEW/XEM mismatch trong `canAccess()` — giờ matrix khớp).

### Biến đổi tên
- User object: `hoTen` → `fullName` ở 6 file (Header, Sidebar, RepairRequestPage, workOrderService, repairRequestService, authService normalize).
- Removed các field backward-compat (`id`, `roleBackend`, `hoTen`) khỏi `normalizeUser()`.

### Các file đã sửa
| File | Mô tả |
|---|---|
| `docs/ROLE_CODES.md` (mới) | Bộ role chính thức + mapping cũ → mới cho BE team |
| `src/services/roleService.js` | Rewrite `SYSTEM_ROLES` (12 role EN), `SYSTEM_FUNCTIONS` (featureCode EN), `initPermissions` dùng map gọn, fix action `VIEW` |
| `src/services/authService.js` | `LEGACY_ROLE_MAP` thay cho `BE_TO_UI_ROLE`; `normalizeUser` trả shape sạch (chỉ field BE chính tắc + `role` đơn) |
| `src/services/equipmentService.js` | API_URL `/api/thiet-bi` → `/api/v1/equipment` |
| `src/App.jsx` | 17 route + 17 `requireFunction` đổi sang EN |
| `src/components/layout/Sidebar.jsx` | Toàn bộ `path` + `func` đổi sang EN; `hoTen → fullName` |
| `src/components/layout/Header.jsx` | `hoTen → fullName` |
| `src/components/layout/AppBreadcrumb.jsx` | `routeLabels` viết lại theo slug EN mới |
| `src/pages/LoginPage.jsx` | `ROLE_REDIRECT` 12 entry theo role EN mới |
| `src/pages/Dashboard.jsx` | 2 `navigate()` cập nhật path EN |
| `src/pages/WorkOrderListPage.jsx` | navigate path |
| `src/pages/WorkOrderPage.jsx` | 2 navigate path |
| `src/pages/RepairRequestPage.jsx` | `currentUser.hoTen → fullName` |

### Kết quả kiểm thử (Playwright)
- ✅ Login `admin/admin123` → redirect `/` (Bảng điều khiển), `scms_current_user` lưu shape mới (`fullName, roles[]`, không còn `hoTen/id/roleBackend`), không có console error.
- ✅ Navigate `/repair/work-orders` → trang load đúng.

### Không thay đổi (giữ scope)
- **Field name trong mock domain objects** (`hoTen`, `chucVu`, `gioVao`, `gioRa`, `thanhVien`, `maPhieu`, `phieuCongTac`…) ở `workOrderService.js` / `repairRequestService.js` / `WorkOrderPage` / `CreateWorkOrderModal`: chưa đổi vì là field schema của entity nghiệp vụ, cần đồng bộ với contract BE — tách thành task riêng "domain model rename" khi BE chốt API contract cho work orders.
- Tên file/component (đã sẵn EN ngoại trừ `EmployeeForm` đã đổi từ trước).

---

## [2026-06-27] — Tích hợp Auth API thật (BE Spring Boot) thay cho mock

### Bối cảnh
BE đã triển khai 5 endpoint trong `docs/API_AUTH.md` (`M6_THERMAL_POWER_PLANT_API`): `POST /api/v1/auth/login`, `GET /me`, `POST /refresh`, `POST /logout`, `POST /api/v1/accounts/create`. Trước đó FE đang dùng `MOCK_USERS` cục bộ trong `authService.js`. Mục tiêu: gọi API thật, hỗ trợ JWT + refresh rotation, mà không phá luồng UI hiện có (Header/Sidebar/ProtectedRoute đang đọc `currentUser.hoTen` & `currentUser.role`).

### Thay đổi
- **`src/services/apiClient.js`** (mới): axios instance dùng chung; request interceptor gắn `Authorization: Bearer <accessToken>`; response interceptor tự gọi `/refresh` khi gặp 401 (rotation token cũ → mới), khoá race bằng `refreshPromise`, nếu refresh fail → clear token và đẩy về `/login`. Export `tokenStore` (get/set/clear) + `API_BASE_URL` (đọc từ `VITE_API_BASE_URL`, mặc định rỗng → đi qua Vite dev proxy).
- **`src/services/authService.js`**: viết lại hoàn toàn — bỏ `MOCK_USERS`. Hàm `login/logout/fetchMe/createAccount` gọi BE thật. Hàm `normalizeUser()` map response BE về shape vừa có field mới (`accountId`, `fullName`, `roles[]`) vừa có field cũ (`id`, `hoTen`, `role`) để Header/Sidebar/ProtectedRoute không phải sửa. Map BE→UI role chỉ cho 3 cặp rõ ràng (ADMIN→ADMIN, TRUONG_CA→SHIFT_LEADER, TRUONG_PHONG→HR); role khác giữ nguyên mã BE.
- **`src/pages/LoginPage.jsx`**: dùng `user.fullName`/`user.roles[0]` thay vì `user.hoTen`/`user.role`. `ROLE_REDIRECT` viết theo role BE thay vì role mock cũ. Sửa hint demo về 2 tài khoản test thật (`admin/admin123`, `user_test_01/user12345`).
- **`src/components/common/ProtectedRoute.jsx`**: thêm bootstrap flow — nếu có `accessToken` nhưng không có user trong storage (F5 reload), tự gọi `/auth/me` để khôi phục. Trong lúc chờ render `null` để tránh nhấp nháy về `/login`.
- **`src/components/layout/Header.jsx`**: `handleLogout` chuyển sang `async` để await `authService.logout()` (gọi `/logout` revoke refresh token).
- **`vite.config.js`**: thêm `server.proxy` `/api → http://localhost:8080` (override bằng env `VITE_API_BASE_URL`). Tránh CORS khi dev FE 5173/5174 gọi BE 8080. **Lý do phải sửa file config** (vi phạm RULE.MD §3 ở mức tối thiểu): không có proxy thì preflight CORS chặn toàn bộ request, integration không chạy được.
- **`src/App.jsx`**: sửa import path `./components/nhansu/NhanSuForm` → `./components/hr/EmployeeForm` (lỗi pre-existing, folder đã đổi tên nhưng import chưa cập nhật — chặn cả build).

### Kết quả kiểm thử (Playwright)
- ✅ `POST /api/v1/auth/login` `admin/admin123` → 200, lưu `scms_access_token` + `scms_refresh_token` + `scms_current_user`, redirect `/admin/phan-quyen`.
- ✅ `GET /api/v1/auth/me` với access token → 200, trả đúng `accountId=1, username=admin, roles=[ADMIN]`.
- ✅ `POST /api/v1/auth/login` `admin/wrong_pw` → 401 `INVALID_CREDENTIALS`, message "Tên đăng nhập hoặc mật khẩu không đúng" hiển thị qua toast.

### Lưu ý cho phiên sau
- Các component cũ check role bằng `currentUser.role` vẫn chạy được do `normalizeUser()` map BE role đầu tiên sang code UI. Với role BE chưa có mapping (NHAN_VIEN, KY_THUAT_VIEN, GIAM_SAT, GIAM_DOC) thì matrix `roleService` trả `false` ⇒ menu rỗng — cần định nghĩa quyền sau khi BE chốt danh sách role chính thức.
- `roleService.js` vẫn dùng mock permissions cho ma trận phân quyền — chưa đụng tới ở task này.
- Khi build production: set `VITE_API_BASE_URL=https://<be-domain>` trước `npm run build`; lúc đó axios sẽ gọi tuyệt đối, không qua Vite proxy.

---

## [2026-06-26] — Bỏ cột "Mô tả sự cố" + sửa lại width cột WorkOrderListPage

### Thay đổi
- **`RepairRequestPage` — xóa cột "Mô tả sự cố"** khỏi bảng. Nội dung này dài, vốn chỉ xem đầy đủ trong modal Chi tiết. Bỏ cột giúp các cột còn lại thoáng và dễ đọc hơn.
- **`WorkOrderListPage` — sửa lại width cột**: lần trước đặt `width: 28%` cho cột Thiết bị + các fixed cộng lại vượt container → bảng tràn ngang, các cột "Trạng thái / Ngày tạo / Thao tác" bị đẩy xa. Sửa bằng cách: để cột Thiết bị `auto` (cột co giãn duy nhất), Người chỉ huy fixed 180px, các cột nhỏ co lại. Tổng fixed = 778px, phần dư dồn hết cho Thiết bị.

### Các file đã sửa
| File | Mô tả |
|------|-------|
| `src/pages/RepairRequestPage.jsx` | Xóa `<th>Mô tả sự cố</th>` + `<td>` tương ứng; điều chỉnh width các cột còn lại |
| `src/pages/WorkOrderListPage.jsx` | Đổi cột Thiết bị từ `width: 28%` sang `auto`; cột Người chỉ huy fixed 180px |

---

## [2026-06-26] — Fix UI bảng: hover lẻ tẻ, mô tả lấn cột, dọn quick-chip thừa

### Thay đổi
- **Bỏ quick-chip "Đang chờ xử lý"** trên toolbar `RepairRequestPage` (trùng chức năng với pill "Chờ duyệt" vừa thêm). Xóa state `pendingCount` và hàm `togglePending` không còn dùng.
- **Sửa hover lẻ tẻ** trên mọi bảng dùng `<Table hover>`: đổi từ `background-color` cứng (bị `.table-hover` của Bootstrap 5 override) sang override CSS variable `--bs-table-hover-bg` + `--bs-table-hover-color`. Giờ toàn bộ td trong row đổi màu đồng đều, kể cả cell chứa `<code className="code-tag">`.
- **Cột "Mô tả sự cố" không còn lấn cột khác**: thêm `table-layout: fixed` cho `.rr-table` + width cố định cho từng cột. `maxWidth` inline trên `<td>` không có tác dụng với `table-layout: auto` mặc định — nguyên nhân khiến cột mô tả tự phình theo nội dung.
- **WorkOrderListPage — cột "Thiết bị / Người chỉ huy / Trạng thái" không còn xa nhau**: thêm `table-layout: fixed` + đặt width 28% cho cột Thiết bị, các cột phụ co lại đúng kích thước nội dung.

### Các file đã sửa
| File | Mô tả |
|------|-------|
| `src/index.css` | Hover bảng dùng `--bs-table-hover-bg` thay vì set `background-color` (thắng Bootstrap đúng cách) |
| `src/pages/RepairRequestPage.jsx` | Bỏ quick-chip, `pendingCount`, `togglePending`; thay inline `maxWidth` bằng class `.rr-cell-truncate`; thêm width cho cột Mã KKS/Thiết bị |
| `src/pages/RepairRequestPage.css` | Xóa style `.rr-quick-chip/.rr-quick-count`; thêm `table-layout: fixed` + `.rr-cell-truncate` |
| `src/pages/WorkOrderListPage.jsx` | Class table `.wol-table`; thêm `width: 28%` cho cột Thiết bị; cell Thiết bị/Người chỉ huy dùng `.wol-cell-truncate` (kèm `title` để hover xem full) |
| `src/pages/WorkOrderListPage.css` | Thêm `.wol-table { table-layout: fixed }` + `.wol-cell-truncate` |

---

## [2026-06-26] — Tích hợp UI nhánh trideptrai + sửa luồng "Tạo PCT"

### Bối cảnh
Nhánh `trideptrai` (đã merge vào main qua PR #1) có sẵn 2 file UI đẹp cho Yêu cầu Sửa chữa (`RepairRequest.jsx` + `ModalCreateWorkOrder.jsx`) nhưng chỉ dùng mock cục bộ, không kết nối service và đang là code mồ côi (không được route). Nhánh `trung-hieu` có CRUD đầy đủ qua service nhưng nút **"Tạo PCT"** lại navigate sang trang list mà không có form tạo — luồng bị hỏng. Bản tích hợp này lấy phần UI tốt nhất của trideptrai, ghép vào logic của trung-hieu.

### Tính năng
- **Stats card trên trang Yêu cầu Sửa chữa**: 4 thẻ tóm tắt (Tổng / Đang chờ duyệt / Đã duyệt / Khẩn cấp chờ duyệt) tự động cập nhật theo phạm vi "của tôi".
- **Filter pills** (Tất cả / Chờ duyệt / Đã duyệt / Đang xử lý / Hoàn thành) song song dropdown hiện có. Pill có badge đếm số lượng. Dropdown vẫn dùng cho trạng thái ít gặp (Từ chối).
- **Sửa luồng "Tạo PCT"**: thay vì navigate sang list, mở `CreateWorkOrderModal` ngay trên trang. Form Formik+Yup gồm: thông tin thiết bị (chỉ đọc, lấy từ yêu cầu), số PCT/địa điểm/nội dung/thời gian dự kiến, 3 vai trò quản lý (tổ trưởng-lãnh đạo / chỉ huy trực tiếp / giám sát AT), đội thực hiện dự kiến dạng multi-select có chip.
- **Tạo PCT thành công** tự động chuyển yêu cầu nguồn từ `DA_DUYET` → `DANG_XU_LY` và reload list.

### Mock API thêm mới
- `workOrderService.createFromRequest(request, dto)` — tạo PCT mới ở trạng thái `CHUA_MO`, gắn `yeuCauId`, kèm bản ghi nhật ký đầu tiên, lưu `thanhVienDuKien`.
- `repairRequestService.markAsProcessing(id)` — chuyển trạng thái yêu cầu `DA_DUYET` → `DANG_XU_LY`.

### Các file đã sửa / thêm
| File | Loại | Mô tả |
|------|------|-------|
| `src/services/workOrderService.js` | MODIFY | Thêm hàm `createFromRequest()` |
| `src/services/repairRequestService.js` | MODIFY | Thêm hàm `markAsProcessing()` |
| `src/components/requests/CreateWorkOrderModal.jsx` | ADD | Modal tạo PCT từ yêu cầu (Formik+Yup, multi-select nhân viên, chip) |
| `src/components/requests/CreateWorkOrderModal.css` | ADD | Style cho modal (section title, request card, NV chip) |
| `src/pages/RepairRequestPage.jsx` | MODIFY | Thêm stats cards, filter pills, wire CreateWorkOrderModal, bỏ navigate "Tạo PCT" hỏng |
| `src/pages/RepairRequestPage.css` | MODIFY | Thêm style `.rr-stats`, `.rr-filter-pills`, `.rr-pill` + responsive |

### Các file đã xóa (orphan)
| File | Lý do |
|------|-------|
| `src/pages/RepairRequest.jsx` | Trùng chức năng với `RepairRequestPage.jsx`, không được route |
| `src/pages/RepairRequest.css` | Đi kèm file trên |
| `src/components/repair/ModalCreateWorkOrder.jsx` | Đã được tái sử dụng thành `components/requests/CreateWorkOrderModal.jsx` |
| `src/components/repair/ModalCreateWorkOrder.css` | Đi kèm file trên |
| `src/services/repairService.js` | File rỗng, không sử dụng |
| Folder `src/components/repair/` | Trống sau khi xóa |

### Ghi chú thiết kế
- **Mapping vai trò**: form dùng nhãn UI "Tổ trưởng / Người lãnh đạo công việc", "Chỉ huy trực tiếp", "Giám sát AT" — submit map lần lượt vào `toTruong`, `nguoiChiHuy`, `nguoiGiamSat` của data model PCT. Không thêm trường mới vào data model PCT để tránh ảnh hưởng `WorkOrderPage`.
- **Đội thực hiện dự kiến**: lưu vào trường mới `thanhVienDuKien` trên data PCT. `WorkOrderPage` hiện tại chưa hiển thị trường này — sẽ bổ sung khi cần.
- **Nguồn danh sách nhân viên**: dùng `AVAILABLE_WORKERS` của `workOrderService` (đã có sẵn 10 người) cho cả 3 vai trò quản lý và đội thực hiện — single source of truth.
- **Lint**: pre-existing warnings của các file khác (setState-in-effect, axios unused) không xử lý trong bản này.

---

## [2026-06-26] — Bổ sung CRUD đầy đủ cho module Yêu cầu sửa chữa

### Tính năng
- **Sửa yêu cầu**: Người tạo có thể sửa mô tả sự cố và mức độ ưu tiên khi trạng thái còn CHO_DUYET. Tái sử dụng `CreateRequestModal` ở chế độ edit (prop `editRequest`), thiết bị/hệ thống disabled khi sửa.
- **Duyệt / Từ chối yêu cầu**: ADMIN và QUAN_DOC thấy nút Duyệt (✓) / Từ chối (✗) trên hàng CHO_DUYET. Xác nhận qua `ConfirmModal` trước khi chuyển trạng thái (CHO_DUYET → DA_DUYET / TU_CHOI).
- **Tạo Phiếu công tác (PCT)**: ADMIN, QUAN_DOC, TO_TRUONG thấy nút Tạo PCT trên hàng DA_DUYET, navigate tới `/sua-chua/phieu-cong-tac` kèm state `fromRequest`.
- **Mock API**: Thêm `update`, `approve`, `reject` trong `repairRequestService` với kiểm tra trạng thái hợp lệ.
- **Sửa lint**: di chuyển `loadEquipments` lên trước `useEffect` trong `CreateRequestModal` để tránh lỗi "accessed before declared".

### Các file đã sửa
| File | Loại | Mô tả |
|------|------|-------|
| `src/services/repairRequestService.js` | MODIFY | Thêm `update()`, `approve()`, `reject()` mock API |
| `src/components/requests/CreateRequestModal.jsx` | MODIFY | Thêm chế độ edit (prop `editRequest`, `enableReinitialize`, disabled fields), sửa thứ tự khai báo `loadEquipments` |
| `src/pages/RepairRequestPage.jsx` | MODIFY | Thêm nút Sửa/Duyệt/Từ chối/Tạo PCT theo role+status, thêm Approve/Reject ConfirmModal, gộp Create/Edit modal |

---

## [2026-06-26] — Thêm bộ lọc Hệ thống vào modal Tạo yêu cầu sửa chữa

### Tính năng
- Thêm dropdown **Hệ thống** phía trên dropdown **Thiết bị** trong `CreateRequestModal`. Chọn hệ thống → danh sách thiết bị chỉ hiển thị thiết bị thuộc hệ thống đó (cascading dropdown).
- **Bộ lọc thuần UI, KHÔNG gửi lên backend**: hệ thống suy ra từ trường `heThong` có sẵn trên thiết bị; form vẫn chỉ submit `thietBiId`. Tránh lưu trùng/lệch dữ liệu.
- Tùy chọn: có option "— Tất cả hệ thống —" (mặc định hiển thị hết). Đổi hệ thống tự reset thiết bị đã chọn để tránh trạng thái mâu thuẫn. Reset bộ lọc mỗi lần mở modal.

### Các file đã sửa
| File | Loại | Mô tả |
|------|------|-------|
| `src/components/requests/CreateRequestModal.jsx` | MODIFY | Thêm state `selectedHeThong`, derive `heThongOptions`/`filteredEquipments`, dropdown Hệ thống lọc danh sách thiết bị |

### Ghi chú
- Không đổi data model (dùng `heThong` sẵn có). Khi nối backend thật nên cân nhắc lọc theo `heThongId` (entity `HeThong`) thay vì so khớp chuỗi tên.

## [2026-06-26] — Gỡ thư viện AOS và animation thừa khỏi giao diện

### Thay đổi
- **Gỡ hoàn toàn thư viện `aos`** (Animate On Scroll): xóa dependency khỏi `package.json`, xóa `AOS.init()` trong `App.jsx`, xóa `AOS.refresh()` và toàn bộ thuộc tính `data-aos`/`data-aos-delay` (13 vị trí) trong `WorkOrderPage.jsx`, `Dashboard.jsx`, `RepairRequestPage.jsx`, `WorkOrderListPage.jsx`.
- **Gỡ animation CSS tự viết** dùng cho hiệu ứng vào trang: `@keyframes fadeIn`, `fadeInLeft`, `slideDown` và class `.animate-fade-in`, `.animate-slide-down` trong `index.css`; `@keyframes fadeInUp` trong `RoleManagementPage.css`; `@keyframes patternMove` (nền chuyển động trang login) trong `AuthLayout.css`. Gỡ class `animate-fade-in` khỏi 13 vị trí JSX.
- **Giữ nguyên**: `@keyframes spin`/`pulse` (spinner loading, chấm trạng thái pulse), shimmer loading bảng (`DataTable.css`), mọi `transition` hover (nút/card/link) và `scroll-behavior: smooth` — để UI vẫn phản hồi tự nhiên khi tương tác.

### Các file đã sửa
| File | Loại | Mô tả |
|------|------|-------|
| `package.json` | MODIFY | Xóa dependency `aos` |
| `src/App.jsx` | MODIFY | Xóa import/khởi tạo AOS, xóa class `animate-fade-in` |
| `src/pages/RepairRequestPage.jsx`, `WorkOrderListPage.jsx`, `RoleManagementPage.jsx` | MODIFY | Xóa `AOS.refresh()`, `data-aos`, class `animate-fade-in` |
| `src/pages/WorkOrderPage.jsx`, `Dashboard.jsx`, `RepairRequest.jsx` | MODIFY | Xóa `data-aos`, class `animate-fade-in` |
| `src/components/layout/AuthLayout.jsx`, `MainLayout.jsx`, `src/components/nhansu/NhanSuForm.jsx` | MODIFY | Xóa class `animate-fade-in` |
| `src/index.css` | MODIFY | Xóa keyframes `fadeIn`/`fadeInLeft`/`slideDown` + class `.animate-fade-in`/`.animate-slide-down` |
| `src/pages/RoleManagementPage.css` | MODIFY | Xóa keyframes `fadeInUp` + animation trên `.role-changes-badge`, `.role-matrix-wrapper` |
| `src/components/layout/AuthLayout.css` | MODIFY | Xóa keyframes `patternMove` + animation trên `.auth-bg-pattern` |

### Ghi chú
- `npm run build` PASS, bundle CSS/JS nhỏ hơn trước (đã gỡ ~34 package phụ thuộc của `aos`).
- 23 lỗi ESLint còn lại đều là lỗi tồn tại từ trước (axios/API_URL chưa dùng trong mock service, set-state-in-effect, biến unused) — không liên quan đến thay đổi này.

## [2026-06-26] — Task 37 & 38 (DEV5): Mở/Đóng PCT theo ngày + chấm giờ + Khóa phiếu

### Tính năng — Rework model Phiếu công tác
- **Phiên làm việc theo ngày** (`phienLamViec`): Phiếu sống nhiều ngày. Mỗi ngày Trưởng ca **Mở phiếu** (đầu ngày) / **Đóng phiếu** (cuối ngày). Mở phiếu ngày mới tự kế thừa danh sách nhân viên từ phiên gần nhất.
- **Chấm giờ nhân viên** (tính lương): Mỗi thành viên thi công có **giờ vào / giờ ra** (chỉnh trực tiếp bằng input `time` khi phiếu đang mở). Đóng phiếu tự chốt giờ ra cho ai chưa có.
- **Thêm/Xóa nhân viên** khi phiếu đang mở (rút khỏi / bổ sung). Pool nhân sự thi công mock `AVAILABLE_WORKERS`.
- **3 vai trò quản lý cố định** (chỉ huy, giám sát an toàn, tổ trưởng) — hiển thị read-only, gắn nhãn "cố định".
- **Bảng tổng hợp giờ công** theo từng nhân viên trên toàn bộ phiên + **Lịch sử phiên đã đóng**.
- **Khóa phiếu (Task 38)**: Từ `TAM_DONG` → `DA_KHOA`, chỉ Trưởng ca/Admin; sau khóa không thao tác được nữa.
- Trạng thái mới: `CHUA_MO → DANG_MO → TAM_DONG → (mở lại) → DA_KHOA`.

### Phân quyền hành động
- Mở / Đóng / Khóa phiếu và quản lý thành viên: chỉ `TRUONG_CA` / `ADMIN` (nút khóa với role khác bị disable + nhãn "Chỉ Trưởng ca"). `QUAN_DOC` / `TO_TRUONG` xem read-only.

### Các file đã thêm/sửa
| File | Loại | Mô tả |
|------|------|-------|
| `src/services/workOrderService.js` | REWRITE | Model `phienLamViec` + thành viên kèm giờ vào/ra; API mock: `openSession`, `closeSession`, `addMember`, `removeMember`, `updateMemberTime`, `lock`; thời gian lưu local (tránh lệch múi giờ) |
| `src/pages/WorkOrderPage.jsx` | REWRITE | UI phiên đang mở + chấm giờ, thêm/xóa nhân viên, tổng hợp giờ công, lịch sử phiên, nút Mở/Đóng/Khóa |
| `src/pages/WorkOrderPage.css` | MODIFY | Styles bảng thành viên, input giờ, phiên đã đóng, tag "cố định" |
| `src/pages/WorkOrderListPage.jsx` | MODIFY | Pulse theo `DANG_MO`; gỡ import thừa |

### Ghi chú
- Lỗi ESLint còn lại (`axios`/`API_URL` trong mock service, `err` unused, `set-state-in-effect`) là **pattern tồn tại từ trước** toàn dự án. `npm run build` PASS.

## [2026-06-26] — Task 34 (DEV5): Phân quyền hệ thống (áp dụng route + Sidebar)

### Tính năng
- **Phân quyền thật theo ma trận**: Thêm helper đồng bộ `canAccess(role, maChucNang)` và `getAccessibleFunctions(role)` trong `roleService`, đọc trực tiếp ma trận quyền (cập nhật được khi Admin sửa ở màn Phân quyền).
- **Gating route theo chức năng**: `ProtectedRoute` thêm prop `requireFunction`. Mọi route nghiệp vụ trong `App.jsx` được gate theo mã chức năng (PHONG_BAN, NHAN_SU, HE_THONG, THIET_BI, YEU_CAU_SC, PHIEU_CT, DANH_GIA_KT, VAT_TU, CCDC, BAO_DUONG). Không đủ quyền → `/unauthorized`.
- **Sidebar lọc theo Role thật**: Bỏ hardcode `userRole='ADMIN'`; menu hiển thị theo quyền XEM của ma trận. Chuẩn hoá mã Role (bỏ `QUAN_DOC_VH`, `TRUONG_KIP`, `QUAN_DOC_SC`, `KY_THUAT_VIEN`). Thêm mục **Quản trị → Phân quyền** (ADMIN). Footer hiển thị tên + vai trò thật.
- **Header**: Hiển thị user thật (tên, vai trò, initials) và **kích hoạt nút Đăng xuất** (trước đây là nút chết) → `authService.logout()` + về `/login`.

### Các file đã thêm/sửa
| File | Loại | Mô tả |
|------|------|-------|
| `src/services/roleService.js` | MODIFY | Thêm `canAccess`, `getAccessibleFunctions` (đồng bộ) |
| `src/components/common/ProtectedRoute.jsx` | MODIFY | Thêm prop `requireFunction` (kiểm tra ma trận) |
| `src/App.jsx` | MODIFY | Bọc tất cả route nghiệp vụ bằng `requireFunction` |
| `src/components/layout/Sidebar.jsx` | MODIFY | Menu theo ma trận quyền; role thật; mục Quản trị; footer user thật |
| `src/components/layout/Header.jsx` | MODIFY | User thật + nút Đăng xuất hoạt động |

### Ghi chú
- Map Role → chức năng theo mặc định `roleService.initPermissions()`: NHAN_SU→nhân sự; THU_KHO_VT→vật tư; THU_KHO_CCDC→CCDC; QUAN_DOC→hệ thống/thiết bị/phiếu CT; TRUONG_CA→yêu cầu SC/phiếu CT; TO_TRUONG→phiếu CT/đánh giá KT/bảo dưỡng; ADMIN→toàn bộ.
- Lỗi ESLint còn lại (`axios`/`API_URL` trong các mock service) là **tồn tại từ trước**. `npm run build` PASS.

## [2026-06-26] — Task 36 (DEV5): Xem danh sách request đã tạo + lọc đang chờ xử lý

### Tính năng
- **Lọc "Yêu cầu của tôi"**: Switch trên toolbar (mặc định BẬT) lọc theo `nguoiTao` = người dùng đang đăng nhập.
- **Quick filter "Đang chờ xử lý"**: Chip hiển thị số lượng yêu cầu `CHO_DUYET` trong phạm vi, bấm để bật/tắt nhanh bộ lọc trạng thái.
- `repairRequestService.create` nay gán `nguoiTao` theo `authService.getCurrentUser()` → yêu cầu mới tạo hiển thị đúng trong "của tôi".

### Các file đã sửa
| File | Mô tả |
|------|-------|
| `src/pages/RepairRequestPage.jsx` | Thêm `onlyMine` + `scopedRequests` + `pendingCount`; switch "Của tôi" và chip "Đang chờ xử lý"; cập nhật empty-state |
| `src/pages/RepairRequestPage.css` | Styles `.rr-quick-chip`, `.rr-quick-count`, `.rr-only-mine` |
| `src/services/repairRequestService.js` | `create()` lấy `nguoiTao` từ user hiện tại |

### Ghi chú
- 2 lỗi ESLint còn lại trong `RepairRequestPage.jsx` là **tồn tại từ trước**. `npm run build` PASS.

## [2026-06-26] — Task 35 (DEV5): Tạo / Xóa Phiếu yêu cầu sửa chữa

### Tính năng & sửa lỗi nghiệp vụ
- **Sửa lỗi nghiệp vụ quan trọng**: Nút "Xem chi tiết" của một Phiếu yêu cầu (PYC) trước đây điều hướng nhầm sang `/sua-chua/phieu-cong-tac/{id}` — tức lấy `id` của PYC để mở Phiếu công tác (PCT). PYC và PCT là **2 thực thể khác nhau**. Nay thay bằng **modal chi tiết PYC riêng (read-only)**.
- **Role-guard**: Route `/sua-chua/yeu-cau` chỉ cho `ADMIN` và `TRUONG_CA` truy cập (đúng ma trận quyền `YEU_CAU_SC`).
- Giữ nguyên chức năng Tạo mới (`CreateRequestModal`) và Xóa (chỉ khi trạng thái `CHO_DUYET` — đúng tinh thần "PYC chưa phải lệnh sửa chữa").

### Các file đã thêm/sửa
| File | Loại | Mô tả |
|------|------|-------|
| `src/components/requests/RequestDetailModal.jsx` | NEW | Modal xem chi tiết PYC (read-only): sự cố, ưu tiên, trạng thái, người tạo, ngày tạo |
| `src/components/requests/RequestDetailModal.css` | NEW | Styles info-grid, priority chip |
| `src/pages/RepairRequestPage.jsx` | MODIFY | Bỏ `useNavigate`; thêm state `detailTarget`; nút Xem mở modal thay vì điều hướng PCT |
| `src/App.jsx` | MODIFY | Bọc route `/sua-chua/yeu-cau` bằng `ProtectedRoute allowedRoles={['ADMIN','TRUONG_CA']}` |

### Ghi chú
- 2 lỗi ESLint còn lại trong `RepairRequestPage.jsx` (`err` unused, `set-state-in-effect`) là **tồn tại từ trước**. `npm run build` PASS.

## [2026-06-26] — Task 33 (DEV5): Đăng nhập + chuyển hướng theo Role

### Tính năng
- **Đăng nhập đa vai trò**: Bổ sung mock user cho đủ **7 Role** (admin, nhansu, thukhovt, thukhoccdc, quandoc, truongca, totruong), mật khẩu = username + "123".
- **Redirect theo Role**: Sau đăng nhập, mỗi Role chuyển tới màn hình chủ tương ứng (ADMIN→Phân quyền, NHAN_SU→Nhân viên, THU_KHO_VT→Danh mục VT, THU_KHO_CCDC→Danh sách CCDC, QUAN_DOC→Thiết bị, TRUONG_CA→Yêu cầu SC, TO_TRUONG→Phiếu công tác).
- **Kích hoạt xác thực thật**: `ProtectedRoute` đọc user từ `authService` thay vì hardcode → chưa đăng nhập sẽ bị đẩy về `/login`; route có `allowedRoles` chặn theo Role thật.

### Các file đã sửa
| File | Mô tả |
|------|-------|
| `src/services/authService.js` | Mở rộng MOCK_USERS từ 2 → 7 role; mã Role thống nhất theo `roleService.SYSTEM_ROLES` |
| `src/pages/LoginPage.jsx` | `ROLE_REDIRECT` đủ 7 role; cập nhật khối Demo accounts |
| `src/components/common/ProtectedRoute.jsx` | Đọc `authService.getCurrentUser()` cho `isAuthenticated` + `userRole` (bỏ hardcode ADMIN) |

### Ghi chú kỹ thuật
- Lỗi ESLint còn lại (`axios`/`API_URL` chưa dùng trong các mock service, `set-state-in-effect`) là **tồn tại từ trước**, không phát sinh do thay đổi này. `npm run build` PASS.
- **Còn nợ cho Task 34**: `Sidebar.jsx` vẫn hardcode `userRole = 'ADMIN'` và dùng mã Role chưa chuẩn (`QUAN_DOC_VH`, `TRUONG_KIP`, `QUAN_DOC_SC`, `KY_THUAT_VIEN`) — sẽ chuẩn hoá + lọc menu theo Role khi làm phân quyền.

## [2026-06-24] — Refactor UI theo Design System Spec + AOS Scroll Animations

### Thay đổi
- **Status colors**: `#22c55e` → `#10b981` (Emerald), `#f59e0b` → `#eab308` (Yellow) — theo spec.
- **Shadow tokens**: Thêm `--shadow-focus` (30% opacity) và `--shadow-accent-glow` (amber glow).
- **Transitions**: `ease` → `ease-in-out` trên toàn hệ thống — theo spec §5.4.
- **Z-index**: Chuyển sang scale 10/20/30/40/50 với aliases (`--z-sidebar`, `--z-header`, `--z-toast`).
- **AOS**: Cài thư viện `aos@2.3.4`, khởi tạo trong `App.jsx`, thêm `data-aos` cho Dashboard, RepairRequest, RoleManagement, WorkOrder.

### Các file đã sửa
| File | Mô tả |
|------|-------|
| `package.json` | Thêm dependency `aos@^2.3.4` |
| `src/index.css` | Cập nhật status colors, shadow tokens, transition easing, z-index scale |
| `src/App.jsx` | Import AOS + `AOS.init()` trong useEffect |
| `src/pages/Dashboard.jsx` | Thêm `data-aos` cho stat cards, request table, equipment panel |
| `src/pages/RepairRequestPage.jsx` | Thêm `data-aos` cho toolbar và table |
| `src/pages/RoleManagementPage.jsx` | Thêm `data-aos` cho permission matrix |
| `src/pages/WorkOrderPage.jsx` | Thêm `data-aos` cho info cards và timeline |
| `src/components/layout/AuthLayout.css` | Dùng `--shadow-accent-glow` token, tăng focus ring opacity |
| `src/components/layout/Header.css` | Dùng `--z-dropdown` cho dropdown menu |

## [2026-06-24] — Triển khai 5 màn hình chính (Login, Phân quyền, Yêu cầu SC, Tạo YC, Phiếu CT)

### Tính năng
- **LoginPage**: Nâng cấp với Formik + Yup validation, chuyển hướng theo Role (ADMIN → Phân quyền, TRUONG_CA → Yêu cầu SC).
- **RoleManagementPage**: Màn hình phân quyền dạng ma trận checkbox (7 Role × 11 Chức năng × 4 Actions), có change tracking và confirm modal.
- **RepairRequestPage**: Dashboard yêu cầu sửa chữa với search KKS, filter trạng thái, bảng dữ liệu, nút xoá chỉ hiện khi CHO_DUYET.
- **CreateRequestModal**: Modal tạo yêu cầu với dropdown thiết bị, textarea mô tả (char count), radio pills ưu tiên, Formik + Yup validation.
- **WorkOrderPage**: Chi tiết phiếu công tác với 3 nút thao tác (Mở/Đóng/Nghiệm thu), info cards, member list, activity timeline.
- Tạo 5 API service layers (mock data) cho auth, equipment, repairRequest, workOrder, role.

### Các file đã thêm/sửa
| File | Loại | Mô tả |
|------|------|-------|
| `src/services/authService.js` | NEW | Mock auth: login/logout/getCurrentUser, 2 demo users |
| `src/services/equipmentService.js` | NEW | Mock danh sách thiết bị (10 items) cho dropdown |
| `src/services/repairRequestService.js` | NEW | CRUD yêu cầu SC, 8 mock records, status/priority enums |
| `src/services/workOrderService.js` | NEW | Phiếu CT: getById, updateStatus với transition validation |
| `src/services/roleService.js` | NEW | Ma trận phân quyền: 7 roles × 11 functions × 4 actions |
| `src/pages/LoginPage.jsx` | MODIFY | Thêm Formik + Yup, role-based redirect |
| `src/pages/RoleManagementPage.jsx` | NEW | Phân quyền ma trận checkbox |
| `src/pages/RoleManagementPage.css` | NEW | Styles: sticky headers, change highlight |
| `src/pages/RepairRequestPage.jsx` | NEW | Dashboard yêu cầu SC |
| `src/pages/RepairRequestPage.css` | NEW | Styles: toolbar, priority badges |
| `src/components/requests/CreateRequestModal.jsx` | NEW | Modal tạo yêu cầu Formik + Yup |
| `src/components/requests/CreateRequestModal.css` | NEW | Styles: radio pills, priority colors |
| `src/pages/WorkOrderPage.jsx` | NEW | Chi tiết phiếu CT + 3 action buttons |
| `src/pages/WorkOrderPage.css` | NEW | Styles: status banner, timeline, info cards |
| `src/App.jsx` | MODIFY | Thêm routes: /admin/phan-quyen, /sua-chua/yeu-cau, /sua-chua/phieu-cong-tac/:id |

### Chi tiết logic
- **Auth mock**: 2 users (`admin/admin123` → ADMIN, `truongca/truongca123` → TRUONG_CA), lưu localStorage.
- **Role redirect**: ADMIN → `/admin/phan-quyen`, TRUONG_CA → `/sua-chua/yeu-cau`.
- **Work Order status flow**: CHUA_MO → DANG_THUC_HIEN → TAM_DUNG → NGHIEM_THU (hoặc mở lại).
- **Nghiệm thu**: Chỉ user có role TRUONG_CA hoặc ADMIN mới bấm được nút.
- **Xoá yêu cầu**: Chỉ cho phép khi trạng thái CHO_DUYET.
- **Không ảnh hưởng code cũ**: Chỉ sửa LoginPage.jsx (upgrade) và App.jsx (thêm routes/imports).

## [2026-06-22] — Thêm module Quản lý Nhân sự (Form thêm mới)

### Tính năng
- Tạo component **NhanSuForm** (thêm/sửa nhân sự) với đầy đủ validation.
- Tạo **nhanSuService** — API service layer cho nhân sự.

### Các file đã thêm
| File | Mô tả |
|------|--------|
| `src/components/nhansu/NhanSuForm.jsx` | Component form thêm/sửa nhân sự với Formik + Yup |
| `src/components/nhansu/NhanSuForm.css` | Styles cho NhanSuForm (avatar upload, status pills, responsive) |
| `src/services/nhanSuService.js` | API service layer (CRUD nhân sự, lấy phòng ban) |

### Chi tiết logic
- **Avatar upload**: Preview ảnh, validate type (JPG/PNG/WebP) & size (≤2MB), gửi qua `multipart/form-data`.
- **Validation (Yup)**: Họ tên (2-100 ký tự), email, SĐT (regex VN), phòng ban (dropdown), chức vụ, chuyên môn, trạng thái.
- **Trạng thái**: Dùng radio pills (Đang làm việc / Nghỉ phép / Nghỉ việc).
- **Phòng ban**: Load dynamic từ API `/api/phong-ban`.
- **Hỗ trợ cả 2 mode**: Thêm mới (`isEdit=false`) và Cập nhật (`isEdit=true` + `initialData`).
- **Không ảnh hưởng code cũ**: Chỉ tạo file mới, không sửa file hiện có.
