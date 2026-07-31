# CHANGELOG — Dự án SCMS

## [2026-07-22] — Dashboard dùng dữ liệu thật (thay toàn bộ mock)

Thay toàn bộ mock data trên Dashboard bằng dữ liệu thật qua **1 endpoint tổng hợp**
`GET /api/dashboard/summary` (KPI cards + area/pie/bar chart + bảng YC gần nhất — 1 request).

### Backend (`M6_THERMAL_POWER_PLANT_API`)
- **Mới**: `dto/dashboard/DashboardSummaryDTO.java` (gồm nested `StatusCountDTO`, `MonthlyTrendDTO`,
  `TopEquipmentDTO`, `RecentRequestDTO`), `controller/dashboard/DashboardController.java`
  (`GET /api/dashboard/summary`), `service/dashboard/DashboardService.java` (gom mọi query vào 1 response).
- **`RepairRequestRepository`**: thêm `countActiveRequests`, `getMonthlyTrend(months)`,
  `getTopRepairedEquipment(lim)`, `findRecentRequests(lim)`.
- **`IEquipmentRepository`**: thêm `countByStatusGrouped` (pie chart).
- **`WorkOrderRepository`**: thêm `countByStatus(WorkOrderStatus)`.
- **`IToolBorrowLogRepository`**: thêm `countOverdue` (CCDC quá hạn: APPROVED, chưa trả, quá `dueDate`).
- **`ISparePartInventoryRepository`**: thêm `countLowStock(threshold)` (net stock < 10).
- Chốt 3 open question: ngưỡng tồn kho = 10 cố định; dùng `dueDate`; không zero-fill tháng trống.

### Frontend (`m6-thermal-power-plant`)
- **Mới**: `services/dashboardService.js` (`getDashboardSummary`).
- **`pages/Dashboard.jsx`**: bỏ toàn bộ mock (`stats`, `recentRequests`, `repairTrendData`,
  `equipmentPieData`, `topEquipmentData`); thêm `useEffect` fetch + loading (`LoadingSpinner`);
  map DTO vào KPI cards, 3 chart (recharts) và bảng (`DataTable`). Bổ sung dòng import `DataTable`
  còn thiếu (đây là điểm khiến trang crash `DataTable is not defined`).

### Nghiệm thu
`npm run build` FE pass; `mvn compile` BE pass. Mở Dashboard: KPI/chart/bảng hiển thị data thật,
console sạch; DB rỗng → card về 0, chart/bảng rỗng, không crash.

---

## [2026-07-20] — #34: Phân quyền theo ROLE (xoá cơ chế permission)

Chi tiết đầy đủ ở CHANGELOG của `M6_THERMAL_POWER_PLANT_API` (cùng ngày, entry "#34: Chuyển phân
quyền từ PERMISSION sang ROLE"). Tóm tắt phần FE:

- `authService.normalizeUser`: bỏ field `permissions` (BE không còn trả).
- `roleService.js`: thêm `HR_STAFF` vào `SYSTEM_ROLES`; thay `canAccess`/`hasPermission` (dead code,
  luôn `return true`) bằng `isAdmin(user)` + `hasAnyRole(user, roles)` — ADMIN luôn qua mọi kiểm tra.
- `ProtectedRoute.jsx`: thực thi thật `allowedRoles` (trước bị bỏ qua) → không đủ role → điều hướng
  `/unauthorized`. Bỏ prop `requireFunction` (dead) + import `canAccess`.
- `Sidebar.jsx`: `canSee` dùng `hasAnyRole`; sửa bug lọc menu (mục cha có `roles` + `children` nhưng
  code cũ chỉ lọc theo role của children, bỏ qua role mục cha); gắn `roles` cho từng mục theo ma
  trận role→chức năng đã chốt với chủ dự án.
- `App.jsx`: bọc từng nhóm route nghiệp vụ bằng `ProtectedRoute allowedRoles` thay vì 1
  `ProtectedRoute` chung không kiểm tra role.
- `docs/ROLE_CODES.md`: cập nhật mô tả role-based, xoá phần mô tả permission-based cũ (permission
  code, `permission_version`, `FEATURE_VIEW_PERMISSIONS`).

### Nghiệm thu
`npm run lint` + `npm run build` sạch cho mọi file đã sửa. Xem CHANGELOG phía API cho phần verify
RBAC chạy thật (login theo từng role, kiểm tra 200/403/401).

---

## [2026-07-20] — Hoàn thiện chức năng Yêu cầu Sửa chữa (#35 + #36)

### Backend (`M6_THERMAL_POWER_PLANT_API`)
- **`RepairService` / `IRepairService`**: `getAllRepairRequests` nhận thêm `priority` + `search`
  (lọc gộp status + độ ưu tiên + từ khoá, server-side); thêm `getStats()` trả số liệu tổng hợp.
- **`RepairRequestRepository`**: thêm query `search(status, priority, kw, pageable)` (pattern giống
  `EquipmentSystemRepository.search`) + `countByStatus` / `countByStatusAndPriority`.
- **`RepairRequestController`**: `GET /` thêm param `priority`, `search`; thêm `GET /stats`.
- **`RepairService.createRepairRequest`**: khi tạo YCSC → set thiết bị `EquipmentStatus.FAILURE`
  (Sự cố) qua dirty-checking. `GET /pending` giữ nguyên (workOrderService còn dùng).
- **`RepairRequestDTO.from`**: fallback `requesterName` = username khi tài khoản chưa có hồ sơ NV.
- **Mới**: `dto/maintenance/RepairRequestStatsDTO.java`.

### Frontend (`m6-thermal-power-plant`)
- **`RepairRequestPage.jsx`**: chuyển sang phân trang + lọc SERVER-SIDE (tái dùng `PaginationPanel`
  + pattern `fetchData` của `ListSystem`); pill counts + stat cards lấy từ `/stats` (khớp tổng,
  không phụ thuộc trang). Thêm pill `Đã duyệt`, dropdown lọc theo độ ưu tiên.
- **`repairRequestService.js`**: `getAll()` → `getList({status,priority,search,page,size})` (bỏ
  hard-code `size=100`); thêm `getStats()`; thêm status `APPROVED` (nhãn "Đã duyệt", variant cobalt).
- **`StatusBadge`**: thêm variant `accent` (cobalt) cho "Đã duyệt" — thuần thêm mới.
- **`CreateRequestModal.jsx`**: xoá nhánh "edit" chết (gọi `update` không tồn tại) → chỉ còn tạo mới.
- **Mới `services/apiError.js`** `getApiErrorMessage()`: đọc được cả body chuỗi thuần lẫn JSON
  `{message}` → sửa lỗi nuốt thông báo khi xoá YC đã có PCT.
- **`AppBreadcrumb.jsx`**: thêm nhãn `yeu-cau` / `phieu-cong-tac` (breadcrumb hết chữ thô).

### Verify
Xem mục Verification trong plan. Backend: build + test endpoint `/stats`, `?priority=`, tạo YC →
thiết bị chuyển Sự cố. Frontend: `npm run dev` + `npm run lint`.

---

## [2026-07-17] — REBUILD UI Phase 5 (CHỐT): polish pass + tài liệu + build

### Thay đổi
- **`src/index.css`**:
  - `.btn:active` lún 1px (tactile feedback toàn cục).
  - `.animate-fade-in` — trước là class RỖNG (gắn sẵn ở hầu hết page root nhưng không làm gì) →
    nay là **staggered reveal CSS-only** (reveal-up 350ms, delay bậc thang 50ms, chỉ
    transform/opacity).
  - Gate `prefers-reduced-motion: reduce` toàn cục — tắt mọi animation/transition trang trí.
- **Quét tàn dư cuối:** `src/**/*.css` còn **0 hex ngoài index.css** (64 hex còn lại đều là
  định nghĩa token). App 100% token-driven.
- **A11y audit nhanh:** focus-visible cobalt ✓, contrast text-primary ~16:1 / secondary ~7:1 /
  nút cobalt ~4.9:1 AA ✓, reduced-motion ✓. Ghi chú: `--text-tertiary` ~2.9:1 (chỉ hint/subtitle,
  dưới AA — chấp nhận có chủ đích).
- **Tài liệu:** `CLAUDE.md` §5.2 viết lại theo hệ Quiet Studio (quy tắc 100%-token + ngoại lệ
  src/pdf), §7 đánh dấu trang Phân quyền đã xoá.

### Verify
`npm run build` ✓ (1.09s). Lint 114 (không đổi so với sau Phase 1; baseline gốc 119).
Screenshot chốt: `docs/ui-refactor/p5-final-dashboard.png`.

---

## [2026-07-17] — REBUILD UI Phase 4: Vật tư + CCDC + Bảo dưỡng + Cổng nhân viên

### Thay đổi
- **Inline style JSX** (không tự ăn token — phải sửa tay): thay `#f8f9fa/#dee2e6/#6c757d` bằng
  `var(--bg-surface-hover)/var(--border-color)/var(--text-tertiary)` trong
  `MaterialDetailModal.jsx` (6 th), `ConsumableFormModal.jsx`, `SparePartFormModal.jsx`,
  `hr/employee/AddEmployee.jsx`, `SparePartsIssueList.jsx`.
  **KHÔNG đụng `src/pdf/`** — react-pdf render riêng, CSS var không hoạt động, hex là bắt buộc.
- **CSS cụm còn lại** (ccdc/lubrication/employee/profile/consumable/spare_part): quét — đã sạch
  hex từ cascade; phần `#fff`/rgba còn lại đều là trắng-trên-nền-đậm hoặc overlay hợp lệ.

### Verify
Lint: 114 (không đổi). Playwright: `/ccdc/danh-sach` (stat tiles + filter) và `/employee`
(EmployeeLayout — layout thứ 2) đều chuẩn Quiet Studio (`docs/ui-refactor/p4-*.png`).

---

## [2026-07-17] — REBUILD UI Phase 3: cụm Nhân sự + Thiết bị

### Thay đổi
- **Equipment** (`components/equipment/style/`): token-hoá toàn bộ hex cứng trong
  `AddEquipment.css`, `ListEquipment.css`, `ListSystem.css` (23 hex: slate/gray Tailwind cũ
  `#f8fafc #f1f5f9 #e2e8f0 #cbd5e1…` → `--bg-surface-hover`/`--border-*`; `#2563eb` →
  `--color-primary-600`; `#dc2626 #b91c1c rgba(239,68,68)` → `--color-status-danger`;
  text grays → `--text-*`). Kết quả: 0 hex còn lại trong 3 file.
- **HR** (`components/hr/`): vốn đã sạch, chỉ vá 2 chỗ — `DetailDepartment.css` nền `#fff` →
  `--bg-surface`, `AddEmployee.css` focus ring steel-blue cũ → `--shadow-focus`.
  Giữ nguyên overlay/danger-tint rgba hợp lệ.

### Verify
Lint: 114 (không đổi). Playwright: `/hr/employees` + `/equipment/system` render chuẩn Quiet Studio
(`docs/ui-refactor/p3-*.png`) — filter bar, submenu 2 cấp, empty state, nút cobalt đều chuẩn.

---

## [2026-07-17] — REBUILD UI Phase 2: cụm Sửa chữa theo Quiet Studio

### Phát hiện quan trọng
Audit thị giác cho thấy **token cascade từ Phase 1 đã tự "ăn" gần trọn cụm Sửa chữa** (WorkOrderList,
RepairRequestPage, filter pills đều đã quy về cobalt qua `--color-primary-600`/`--btn-primary-bg`).
Việc thật của Phase 2 là dọn các đảo hard-code còn sót:

### Thay đổi
- **`technical_assessment/TechnicalAssessmentList.css`** — viết lại: badge trạng thái bỏ 8 hex cứng
  (`#92400e #fef3c7 #166534 #dcfce7…`) → hệ 5 màu `--color-status-*` (tự chạy đúng cả dark mode).
- **`spare_parts_issue/SparePartsIssueForm.css`** (file hard-code nặng nhất repo) — token-hoá:
  status-dot 4 màu, focus ring steel-blue cũ `rgba(62,101,162)` → `--shadow-focus`, bảng spare-table
  (viền `#dee2e6`, hover `#f8f9fa/#f8fbff`, header `#f8fafc`) → token, unit-badge Bootstrap blue
  (`#e7f1ff/#0d6efd`, khối trùng lặp thứ 2 bị xoá) → `--color-primary-*`, icon PDF `#dc3545` →
  `--color-status-danger`, radius cứng 8/12/999px → `--radius-*`. GIỮ trắng-trên-overlay (hợp lệ).
- **`repair_history/repairHistoryList.css`** — token-hoá toàn bộ (icon `#0d6efd`, hover `#f8f9fa`,
  radius cứng).
- Xác minh: pills active của cả 3 trang (rr-/yc-/wo-) đã đồng nhất cobalt; modal thừa hưởng
  `radius-xl`/`shadow-xl` mới; `#fff` còn lại đều là chữ trắng trên nền đậm (giữ).

### Verify
Lint: 114 lỗi (không đổi — chỉ sửa CSS). Playwright: WorkOrder + TechnicalAssessment +
RepairRequest render chuẩn Quiet Studio (`docs/ui-refactor/p2-*.png`); error-state RepairRequest
hiển thị đúng khi không có backend.

---

## [2026-07-17] — REBUILD UI Phase 0+1: concept "Quiet Studio" + nền móng + xoá 2 trang admin

### Bối cảnh
Chủ dự án quyết định **rebuild toàn bộ giao diện** (thay cho hướng refactor đen Vercel/Carbon ở entry
dưới — bản đó bị chê "cứng nhắc, giống AI code"). Plan rebuild 6 phase đã duyệt; nguyên tắc: giữ nguyên
`src/services/` + route path, chỉ đổi UI; xoá trang Phân quyền & Tạo tài khoản theo yêu cầu.

### Phase 0 — Concept (đã chốt)
Dựng 3 concept khác biệt render trên app thật (`docs/ui-refactor/concept-*.png`): Quiet Studio /
Warm Paper / Navy Crisp. Chủ dự án chọn **"Quiet Studio"**: font **Outfit**, bo góc 8–18px, card
**không viền + bóng mềm nhiều lớp**, nền lạnh `#f6f7f9`, sidebar TRẮNG, accent **cobalt `#3b5bfd`**,
giữ 5 màu status + IBM Plex Mono cho mã.

### Phase 1 — Nền móng (hoàn tất, đã verify)
- **`src/index.css`** — viết lại token theo Quiet Studio (light + dark), giữ nguyên tên biến.
  Sửa bug cũ: `--font-sans` vẫn trỏ `'Inter'` dù `@import` đã đổi → nay trỏ `'Outfit'`.
  Bỏ khối `[data-accent="blue"]` (hết vai trò). `.surface-card`/`.card`: viền transparent + bóng mềm,
  dark mode thêm viền mảnh.
- **Common**: `DataTable.css` thêm `tabular-nums`; `SearchBox` chuyển inline style → `SearchBox.css`
  (file mới); `EmptyState.css` icon đặt trong đĩa tròn tint. (StatusBadge/PageHeader/LoadingSpinner
  đã 100% token — tự nhận diện mạo mới, không cần sửa.)
- **Layout**: `Sidebar.css` sửa hard-code chữ trắng (brand, tên user — bug hiện hình khi sidebar sáng),
  logo amber → cobalt, active border amber → cobalt; `Header.css` tokenize avatar;
  **`AuthLayout.css` viết lại toàn bộ** (dark-glass amber → sáng Quiet Studio, radial wash cobalt).
- **Xoá trang** (yêu cầu chủ dự án): `RoleManagementPage.jsx|.css`, `CreateAccountPage.jsx|.css`;
  gỡ 2 route + 2 import trong `App.jsx`; xoá section "Quản trị" trong `Sidebar.jsx`;
  `roleService.js` gỡ object `roleService` + `FEATURE_VIEW_PERMISSIONS` (GIỮ `SYSTEM_ROLES`/`canAccess`
  vì Sidebar/Header/ProtectedRoute còn dùng). `CreateWorkerAccountPage` (ccdc) KHÔNG liên quan — giữ.
- **Dọn xác chết**: xoá `WorkOrderPage.jsx|.css`, `WorkOrderListPage.jsx|.css` (mồ côi, service không
  khớp); bỏ route `/equipment/equipments` khai báo trùng; đổi tên `"ToolCategory .jsx"` (có dấu cách)
  → `ToolCategory.jsx`.

### Verify
`npm run lint`: 114 lỗi (baseline cũ 119 — GIẢM 5, không lỗi mới). Playwright: login + dashboard
light/dark OK (`docs/ui-refactor/p1-*.png`), menu không còn "Quản trị", `/admin/roles` → 404.

---

## [2026-07-17] — Refactor UI (Pha 1 cũ — ĐÃ THAY THẾ bởi rebuild ở trên): hệ token đen Vercel + Carbon + IBM Plex Sans

### Bối cảnh
Chủ dự án yêu cầu refactor toàn diện diện mạo cho chuyên nghiệp/nhất quán, tham khảo 3 bộ design tải về
(`VERCEL_DESIGN.md`, `AIRTABLE_DESIGN.md`, `IBM_DESIGN.md`), **giữ nguyên mọi call API**. Hướng chốt:
backbone **IBM Carbon** (vuông, phẳng, viền mảnh) + **màu đen Vercel `#171717`** làm primary/chrome +
**IBM Plex Sans** cho chữ. Quyết định này **thay thế** quyết định "giữ palette steel-blue, không re-skin"
ở entry cũ bên dưới — đây là yêu cầu thị giác mới, có chủ đích của chủ dự án.

> **Pha 1 = mũi khoan thăm dò**, không phải bản hoàn thiện. Viết lại tầng token để cả app cascade theo +
> reskin trang flagship (Phiếu Công tác). Các trang còn hard-code màu (~12% khai báo) sẽ lộ ra để dọn ở Pha 2.

### Thay đổi
- **`src/index.css`** — viết lại tầng token, **giữ nguyên toàn bộ tên biến** (không gãy ~1700 điểm tham chiếu):
  - Font: `Inter` → **IBM Plex Sans** (`@import` + `--font-sans`). Mono giữ IBM Plex Mono.
  - Palette `--color-primary-*`: steel-blue → thang **đen/xám trung tính** (`#171717`…`#f4f4f4`).
  - `--color-neutral-*`: xám ám xanh → **xám thật kiểu Carbon**.
  - `--radius-*`: bo góc **2px** (Carbon vuông). `--shadow-*`: giảm mạnh (tile dùng viền, không bóng).
  - Semantic (light + dark): **sidebar đen `#171717`/`#000`** (chrome), giữ vùng nội dung sáng để status nổi.
  - **Màu status GIỮ NGUYÊN** (green/yellow/red/gray/blue — ngữ nghĩa an toàn công nghiệp).
  - Thêm biến `--btn-primary-*` + khối **`[data-accent="blue"]`** để bật/tắt accent xanh (biến thể A/B).
  - Link/selection/focus/`.btn-primary`/`.btn-outline-primary`/form-focus trỏ về token mới.
- **`src/components/work_order/WorkOrderList.css`** — filter pill vuông (Carbon) + active state đen đậm.

### Không đụng
Services/API, markup/logic component, CSS riêng các trang khác (để Pha 2), file cấu hình.

---

## [2026-07-17] — Đồng bộ giao diện: vá token hỏng + áp quy tắc thị giác scms-design

### Bối cảnh
Rà giao diện theo skill `scms-design`. Skill này được viết khi **chưa có codebase** (readme của skill:
*"No codebase, Figma file, or existing product screens were attached"*) nên palette của nó (IBM Plex Sans,
oklch, cấm cam, không dark mode) **mâu thuẫn** với hệ thống đã chạy trong `index.css` (Inter, hex steel-blue
`#3e65a2`, có accent cam, có dark mode). Chốt với chủ dự án: **giữ palette + dark mode hiện tại**, chỉ lấy
**quy tắc thị giác** của skill và vá drift. Không re-skin.

### Vấn đề gốc: 21 token dùng nhưng chưa bao giờ định nghĩa
Mỗi dev tự đặt tên token riêng (`--danger-color`, `--primary-color`, `--color-primary`, `--surface-light`,
`--border-secondary`…) trong khi `index.css` đặt là `--color-status-danger`, `--color-primary-600`,
`--bg-surface`… Phần lớn **không có fallback** → CSS invalid → thuộc tính bị bỏ, giá trị inherit.
Ví dụ dấu `*` bắt buộc (`.required-asterisk`) đang ăn màu đen thay vì đỏ.

Đã đổi tên **50 usage / 19 file** về token canonical. Bảng map chính:

| Token bịa | → Canonical |
|---|---|
| `--danger-color`, `--color-danger-500`, `--color-status-error` | `--color-status-danger` |
| `--color-status-success` | `--color-status-normal` |
| `--primary-color`, `--color-primary` | `--color-primary-600` |
| `--primary-light` | `--color-primary-50` |
| `--surface-light`, `--bg-subtle`, `--bg-secondary`, `--color-surface-secondary` | `--bg-surface-hover` |
| `--surface-card`, `--color-surface-primary` | `--bg-surface` |
| `--border-light`, `--border-secondary` | `--border-color` |
| `--border-tertiary`, `--border-primary` | `--border-color-strong` |
| `--text-quaternary` | `--text-tertiary` |
| `--font-normal` | `--font-regular` |

Cũng sửa 4 chỗ token có fallback hex cứng (`var(--surface-card, #fff)`…) — fallback luôn thắng vì token
không tồn tại, nên **phá dark mode** (vd `<thead>` sticky luôn trắng).

> `--priority-color` **không đụng**: nó được set động qua inline style (`RepairRequestDetailModal.jsx:64`)
> và luôn có fallback — đúng pattern.

### Quy tắc thị giác (theo skill)
- **Bỏ 11 chỗ hover `translateY`/`scale`** — skill: *"no scale/shrink transforms; this is precision software"*.
  Chỗ nào hover chỉ có transform+shadow thì thay bằng tín hiệu nền/viền để không mất phản hồi hover.
  Giữ 2 chỗ `translateY(-50%)` vì đó là kỹ thuật căn giữa, không phải hover.
- **Bỏ shadow khi hover**, dùng border/background. Shadow chỉ dành cho thứ nổi lên trên (modal, dropdown).
- **Làm phẳng 25/26 gradient**. Giữ lại `DataTable.css` skeleton shimmer vì đó là gradient **chức năng**
  (hiệu ứng loading), không phải trang trí.
- **Thêm `:focus-visible` toàn cục** — trước đó **0 chỗ** có focus ring (lỗi accessibility).
- **Accent cam**: giữ (theo brand mark) nhưng thu hẹp — xoá `--shadow-accent-glow`, làm phẳng gradient cam.
- **Bỏ emoji `⚡` ở 2 logo** (AuthLayout, Sidebar) → `BsLightningChargeFill`. Skill: *"No emoji… anywhere"*.
- Bỏ lưới nền động ở trang login (skill cấm pattern/texture), xoá cả `<div className="auth-bg-pattern" />`.
- 2 header bảng dùng `#0d6efd` (xanh mặc định Bootstrap, **lệch palette dự án**) → `--color-primary-600`.

### File bị ảnh hưởng
38 file (33 `.css`, 5 `.jsx`). Trọng tâm: `index.css`, `components/layout/AuthLayout.{css,jsx}`,
`components/layout/Sidebar.{css,jsx}`, `components/work_order/WorkOrderDetailModal.css`,
`components/spare_parts_issue/SparePartsIssueForm.css`, `pages/Dashboard.css`, `pages/WorkOrderPage.css`,
`components/hr/**/style/*.css`, `components/equipment/style/*.css`.

### Kiểm chứng
- `npm run lint`: **134 vấn đề trước = 134 sau** (so bằng `git stash`) → không thêm lỗi mới; 134 lỗi này có sẵn ở file khác.
- `npm run build`: pass.
- Chạy dev + đo computed style trên `/login`: mọi token resolve ra giá trị thật; `.required-asterisk`
  compute `rgb(239,68,68)` (đỏ) thay vì đen; nền login `background-image: none`, màu đặc `rgb(27,42,74)`;
  logo là `<svg>`, không còn emoji; 0 token bịa còn sót trong toàn bộ stylesheet đã load.
- Toggle `data-theme=dark`: 5/6 token đảo màu đúng → dark mode nguyên vẹn.

### Còn lại (chưa làm — cần quyết định riêng)
- **15 file dùng `<Table>` thô** thay vì `DataTable`, **9 file dùng `<Badge>` thô** thay vì `StatusBadge`.
  Hoãn theo thống nhất: đụng nhiều file của nhiều dev, dễ xung đột merge giữa sprint.
- Còn emoji ở vài chỗ UI khác (`🚧` placeholder, `✅`, `👋`, `📷` fallback ảnh) — chưa đụng vì nằm trong
  nội dung nghiệp vụ, không phải chrome.
- 2 header bảng nay đã phẳng + đúng palette nhưng vẫn là "thanh xanh", trong khi `index.css` quy định
  header bảng là chữ hoa nhỏ trên nền trong suốt → còn lệch, cần chốt thiết kế.
- `--color-primary-50` không đổi theo dark mode (là nấc palette tĩnh), nên avatar dùng `--primary-light` cũ
  nay hiện nền xanh nhạt ở dark mode. Đúng ý đồ ban đầu nhưng là thay đổi thấy được.

---

## [2026-07-06] — Ghi nhận: login production đã chạy (fix CORS phía backend)

Login trên `cloudfront.net` từng lỗi "Đăng nhập thất bại" dù API trả 200 khi test bằng curl.
Gốc rễ nằm ở backend: `CorsConfig` chỉ cho phép `localhost`, trình duyệt gửi Origin CloudFront
→ Spring Security chặn 403 → CloudFront biến 403 thành index.html → frontend nhận HTML, không
parse được token. Đã fix ở repo backend (`CorsConfig` dùng `AllowedOriginPatterns` + domain
CloudFront). Frontend không đổi gì về logic — entry này chỉ để ghi nhận mốc login production OK.

## [2026-07-06] — Đồng bộ bộ role theo main sau merge (bỏ bộ 9 role dev tự đặt)

### Bối cảnh
Merge `main` về phát hiện main đã seed bộ **10 role chuẩn** (Flyway `V3__seed_sample_data.sql`) khác hẳn bộ 9 role dev tự đặt. Chủ dự án/team dùng bộ main → dev đồng bộ theo main để tránh loạn DB (role trùng ý nghĩa khác tên).

### Bộ role chuẩn (main, id theo V3)
`WORKER`(1), `MATERIALS_STOREKEEPER`(2), `TOOLS_STOREKEEPER`(3), `WORKSHOP_FOREMAN`(4), `SHIFT_LEADER`(5), `CREW_LEADER`(6), `MAINTENANCE_FOREMAN`(7), `TEAM_LEADER`(8), `SAFETY_SUPERVISOR`(9), `ADMIN`(10).

### Đổi tên (dev cũ → main)
`MATERIAL_WAREHOUSE_KEEPER→MATERIALS_STOREKEEPER`, `TOOL_WAREHOUSE_KEEPER→TOOLS_STOREKEEPER`, `OPERATIONS_WORKSHOP_MANAGER→WORKSHOP_FOREMAN`, `MAINTENANCE_WORKSHOP_MANAGER→MAINTENANCE_FOREMAN`. Bỏ `HR` (main không có — menu Nhân sự tạm gán ADMIN). Thêm `WORKER`, `SAFETY_SUPERVISOR`.

### Các file đã sửa
| File | Mô tả |
|---|---|
| `src/services/roleService.js` | `SYSTEM_ROLES` → 10 role của main |
| `src/pages/LoginPage.jsx` | `ROLE_REDIRECT` theo tên main |
| `src/pages/RepairRequestPage.jsx` | `APPROVER_ROLES`/`PCT_CREATOR_ROLES`: `MAINTENANCE_FOREMAN` |
| `src/components/layout/Sidebar.jsx` | Menu Nhân sự → `ADMIN`; CCDC → `TOOLS_STOREKEEPER` |
| `docs/ROLE_CODES.md` | Viết lại theo 10 role main |

### Backend đi kèm (repo API)
- Flyway `V4__permission_based_rbac.sql`: tạo bảng `permissions`, `role_permissions`, cột `accounts.permission_version` (bắt buộc vì main chuyển sang `ddl-auto=validate`).
- Flyway `V5__seed_permissions.sql`: seed 44 permission. KHÔNG seed role (V3 đã có), KHÔNG seed role_permissions (gán qua UI).
- Resolve conflict `Jenkinsfile`/`Jenkinsfile.ci` theo main (bỏ Unit Test khỏi CI/CD).

### Lưu ý
- DB dev cần drop + để Flyway chạy lại V1→V5 (vì chuyển sang Flyway validate).
- Gán role_permissions cho từng role qua `/admin/roles`. ADMIN full quyền sẵn qua code check.

---

## [2026-07-05] — Phân quyền permission-based: FE gọi API thật, đồng bộ role code với BE

### Bối cảnh
Backend đã triển khai permission-based RBAC (bảng `permissions`, `role_permissions`, cơ chế permission_version) và seed 9 role theo bộ tên mới. FE chuyển từ ma trận phân quyền mock sang dùng permission thật do BE trả về khi login/me.

### Bộ role code chính thức (khớp DB backend — thay bộ cũ trong ROLE_CODES.md)
`ADMIN`, `HR`, `MATERIAL_WAREHOUSE_KEEPER`, `TOOL_WAREHOUSE_KEEPER`, `OPERATIONS_WORKSHOP_MANAGER`, `SHIFT_LEADER`, `CREW_LEADER`, `MAINTENANCE_WORKSHOP_MANAGER`, `TEAM_LEADER`.
Mapping đổi tên: `HR_STAFF→HR`, `MATERIAL_KEEPER→MATERIAL_WAREHOUSE_KEEPER`, `TOOL_KEEPER→TOOL_WAREHOUSE_KEEPER`, `OPERATIONS_MANAGER→OPERATIONS_WORKSHOP_MANAGER`, `WATCH_LEADER→CREW_LEADER`, `REPAIR_MANAGER→MAINTENANCE_WORKSHOP_MANAGER`.

### Các file đã sửa
| File | Mô tả |
|---|---|
| `src/services/roleService.js` | Bỏ toàn bộ mock (SYSTEM_FUNCTIONS, PERMISSION_ACTIONS, mockPermissions). `SYSTEM_ROLES` đổi sang role code mới. `canAccess(user, featureCode)` đọc `user.permissions` thật (map featureCode → permission `*_VIEW`). Thêm `hasPermission(user, code)`. API thật: `getRoles`, `getAllPermissions`, `getRolePermissions(roleId)`, `updateRolePermissions(roleId, permissionIds)` |
| `src/services/authService.js` | `normalizeUser` giữ `permissions` từ BE; xoá `LEGACY_ROLE_MAP` (BE đã seed EN) |
| `src/pages/RoleManagementPage.jsx` | Viết lại: chọn role (pills) → checklist permission thật nhóm theo domain, lưu qua `PUT /api/v1/roles/{id}/permissions`. Bỏ ma trận role × chức năng × action cũ (không khớp cấu trúc permission phẳng của BE) |
| `src/pages/RoleManagementPage.css` | Thêm style cho layout checklist mới (giữ nguyên class cũ) |
| `src/components/common/ProtectedRoute.jsx` | `canAccess(currentUser, requireFunction)` — signature mới |
| `src/components/layout/Sidebar.jsx` | Role hardcode `NHAN_SU→HR`, `THU_KHO_CCDC→TOOL_WAREHOUSE_KEEPER`; `canSee` truyền user object |
| `src/pages/LoginPage.jsx` | `ROLE_REDIRECT` cập nhật 6 role code mới |
| `src/pages/RepairRequestPage.jsx` | `APPROVER_ROLES`/`PCT_CREATOR_ROLES`: `REPAIR_MANAGER→MAINTENANCE_WORKSHOP_MANAGER` |

### Backend đi kèm (repo M6_THERMAL_POWER_PLANT_API)
- `UserInfoDTO` thêm field `permissions` (List<String>) — trả về trong login/me.
- `AuthService.toUserInfo` populate permissions qua `PermissionService.resolvePermissionCodes`.

### Lưu ý
- Ẩn/hiện menu ở FE chỉ là lớp UX — chặn thật nằm ở BE (`@PreAuthorize`). Khi admin đổi quyền, user đang online nhận quyền mới ở request kế tiếp (cơ chế permission_version buộc refresh token).
- `docs/ROLE_CODES.md` cần cập nhật theo bộ role mới (chưa làm trong đợt này).

---

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
