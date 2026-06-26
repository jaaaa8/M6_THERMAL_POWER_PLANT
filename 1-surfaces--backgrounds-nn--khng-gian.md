# SCMS - Design System & UI Guidelines

Tài liệu này định nghĩa các biến thiết kế (Design Tokens) và quy tắc giao diện (UI Rules) cốt lõi cho hệ thống SCMS. Mọi component và layout do AI sinh ra phải tuân thủ nghiêm ngặt các thông số dưới đây.

## 1. Typography (Nghệ thuật chữ)

Sử dụng hệ thống chữ có tính phân cấp cao, dễ đọc cho hệ thống quản lý dữ liệu lớn.

* **Font-family chính:** `Inter`, sans-serif (Dùng cho toàn bộ UI, heading, paragraph).
* **Font-family phụ (Monospace):** `IBM Plex Mono`, monospace (CHỈ dùng để hiển thị Mã KKS, Mã Yêu cầu, Mã Phiếu công tác, thông số kỹ thuật để tạo sự đồng rập, dễ đối chiếu).
* **Base size:** `14px` (Text thông thường).
* **Scale (8 levels):** `12px` (xs) -> `14px` (sm - base) -> `16px` (md) -> `18px` (lg) -> `20px` (xl) -> `24px` (2xl) -> `30px` (3xl).

## 2. Color Palette (Hệ thống màu sắc)

SCMS hỗ trợ cả Light & Dark Theme. Phân bổ màu sắc phải tuân thủ ý nghĩa nghiệp vụ.

| Semantic Token      | Hex (Light) | Mô tả & Chức năng                                                            |
| :------------------ | :---------- | :------------------------------------------------------------------------------- |
| `primary`         | `#385d9a` | (Steel Blue) Màu chủ đạo. Dùng cho Header, Sidebar active, Primary Buttons. |
| `accent`          | `#f59e0b` | (Amber) Màu nhấn. Dùng cho các Action nổi bật, Notification Badge.         |
| `status_normal`   | `#10b981` | (Emerald) Trạng thái Tốt, Đã hoàn thành, Đã nghiệm thu.                |
| `status_warning`  | `#eab308` | (Yellow) Trạng thái Cảnh báo, Chờ xử lý, Sắp đến hạn bảo dưỡng.    |
| `status_danger`   | `#ef4444` | (Red) Sự cố hỏng hóc, Mức độ ưu tiên CAO, Nút Xóa.                    |
| `status_info`     | `#3b82f6` | (Blue) Trạng thái Đang tiến hành (Ví dụ: Đang sửa chữa).               |
| `status_inactive` | `#9ca3af` | (Gray) Thiết bị dự phòng, Phiếu đã đóng, Disabled states.               |

*Lưu ý cho Dark Theme:* Giữ nguyên sắc thái (hue) nhưng tăng độ sáng (lightness) của các màu Status/Accent lên khoảng 10-15% để đảm bảo độ tương phản trên nền tối.

## 3. Shape & Spacing (Hình khối & Khoảng cách)

Tuân thủ hệ thống lưới 4pt để đảm bảo UI cân xứng tuyệt đối.

* **Spacing Scale:** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`.
  * *Quy tắc:* Dùng `16px` hoặc `24px` cho padding của các Container/Card. Dùng `8px` hoặc `12px` cho khoảng cách giữa các phần tử bên trong Card.
* **Border Radius:**
  * `sm (4px)`: Checkbox, Tags nhỏ, Input fields.
  * `md (6px)`: Buttons, Dropdown menus.
  * `lg (8px)`: Cards, Modals nhỏ.
  * `xl (12px)`: Layout Containers chính, Modals lớn.
  * `full (9999px)`: Avatars, Status dots, Badges.

## 4. Depth & Elevation (Chiều sâu & Đổ bóng)

Sử dụng z-index và shadows để phân tầng thông tin, giúp người dùng tập trung vào nội dung chính.

* **Z-index Layers (5 cấp):**
  1. `z-10`: Sticky Headers, Tabs.
  2. `z-20`: Dropdowns, Tooltips.
  3. `z-30`: Floating Action Buttons (FAB).
  4. `z-40`: Overlays/Backdrops.
  5. `z-50`: Modals, Dialogs, Toast Notifications.
* **Shadows (Light Theme):**
  * `sm`: Dùng cho nút bấm, thẻ thông tin nhỏ.
  * `md`: Dùng cho Cards, Panels chứa nội dung.
  * `lg`: Dùng cho Dropdown, Popover.
  * `xl`: Dùng cho Modals.
  * `focus-ring`: Viền bao quanh Input/Button khi focus (Màu primary với 30% opacity).
  * `accent-glow`: Đổ bóng tỏa sáng màu Amber cho các cảnh báo nghiêm trọng.
* *Lưu ý cho Dark Theme:* Tăng hệ số Alpha của Shadow (đậm hơn) hoặc chuyển sang dùng border mỏng (`1px solid #334155`) thay cho shadow để phân tách các khối.

## 5. SCMS Core UI Rules (Quy tắc thiết kế cốt lõi)

1. **Chữ Mono cho Dữ liệu Kỹ thuật:** Bất cứ khi nào hiển thị mã định danh (Ví dụ: `KKS: ABC002M1`, `REQ-2026-001`), bắt buộc phải bọc trong thẻ sử dụng font `IBM Plex Mono` và có nền xám nhạt để tách biệt với văn bản thường.
2. **Màu sắc thay cho Trạng thái:** Ranh giới giữa các tab hoặc card nên sử dụng sự khác biệt về màu nền thay vì dùng viền (border) dày. Chỉ dùng border mỏng (1px, màu nhạt) cho bảng dữ liệu (Data Table).
3. **Hành động rõ ràng:** Nút hành động chính (Primary Action) dùng màu `primary`. Các hành động hủy/đóng (Secondary) chỉ dùng viền (Outline) hoặc nền xám/trong suốt (Ghost).
4. **Transitions:** Sử dụng transition `150ms ease-in-out` cho mọi hiệu ứng hover (nút bấm, dòng trong bảng) để tạo cảm giác mượt mà nhưng không rườm rà.
