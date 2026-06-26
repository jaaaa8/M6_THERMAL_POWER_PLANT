# CHANGELOG — Dự án SCMS

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
