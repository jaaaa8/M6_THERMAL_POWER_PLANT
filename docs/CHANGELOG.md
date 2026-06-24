# CHANGELOG — Dự án SCMS

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
