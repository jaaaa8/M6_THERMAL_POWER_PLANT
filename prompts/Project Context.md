# Ngữ cảnh Dự án: SCMS — Hệ thống Quản lý Thiết bị, Sửa chữa & Bảo dưỡng Nhà máy Nhiệt điện

**Role (Vai trò Dự án):** Đây là tài liệu định hướng cốt lõi dành cho AI Agent khi thiết kế, lập trình và bảo trì mã nguồn dự án.

**Objective (Mục tiêu):** Xây dựng Hệ thống SCMS (Supply Chain & Maintenance System) phục vụ quản lý toàn bộ quy trình vận hành, sửa chữa và bảo dưỡng thiết bị trong nhà máy nhiệt điện. Hệ thống xử lý các nghiệp vụ: quản lý nhân sự & phân quyền, quản lý hệ thống & thiết bị (mã KKS), tạo yêu cầu sửa chữa, lập phiếu công tác, đánh giá kỹ thuật, quản lý vật tư (tiêu hao & thay thế), quản lý công cụ dụng cụ (mượn/trả), và bảo dưỡng định kỳ (dầu mỡ).

**Details (Chi tiết Yêu cầu):**

1. **Phạm vi (Scope)**
   - ✅ IN-SCOPE:
     - Quản lý Nhân sự & Phân quyền (PhongBan, NhanSu, TaiKhoan, VaiTro).
     - Quản lý Hệ thống & Thiết bị (HeThong, ThietBi, LoaiThietBi, ThongSoThietBi).
     - Yêu cầu Sửa chữa (PhieuYeuCauSuaChua).
     - Phiếu Công tác & Gia hạn (PhieuCongTac, ThanhVienPCT, GiaHanPCT, NhatKyPCT).
     - Đánh giá Kỹ thuật (BienBanDanhGiaKyThuat, ChiTietVatTuDeXuat).
     - Quản lý Vật tư nhập/xuất kho (LoaiVatTu, VatTu, GiaoDichKho).
     - Quản lý Công cụ Dụng cụ mượn/trả (CongCuDungCu, NhatKyMuonTraCongCu).
     - Bảo dưỡng Định kỳ dầu mỡ (KeHoachBaoDuongDauMo, LichSuBaoDuongDauMo).
   - ❌ OUT-OF-SCOPE: Các tính năng không nằm trong danh sách nghiệp vụ trên (trừ khi có yêu cầu cụ thể từ người dùng).

2. **Công nghệ (Tech Stack)**
   - Frontend: React 19, Vite 8, React Router DOM 7, React Bootstrap, Formik + Yup (Validation), Axios (HTTP Client), React Toastify (Notification).
   - Backend: Java 17, Spring Boot 3.5.x (REST API).
   - Modules Backend: Spring Web, Spring Data JPA, Spring Security, Spring Mail, Validation.
   - Database: MySQL (thiết kế trong file `database.mwb`).
   - Build Tool Backend: Gradle, Lombok.
   - Cấu trúc kiến trúc:
     - **Frontend:** Component-Based Architecture (Pages → Components → Services/API).
     - **Backend:** MVC tiêu chuẩn (Controller REST → Service → Repository → Entity).

3. **Mục tiêu Kiến trúc & Mã nguồn**
   - **Frontend (React):**
     - Tách biệt logic: Components chỉ xử lý hiển thị, logic gọi API đặt trong thư mục `services/`.
     - State Management: Sử dụng React hooks (useState, useEffect, useContext) và Formik cho form state.
     - Routing: Sử dụng React Router DOM với lazy loading khi cần.
     - Validation: Sử dụng Yup schema validation kết hợp Formik.
     - Error Handling: Hiển thị lỗi thân thiện qua React Toastify, không để lỗi raw hiện ra UI.
   - **Backend (Spring Boot REST API):**
     - Tách biệt logic: Tuyệt đối không viết business logic trong Controller. Phải thông qua Service layer.
     - DTOs: Sử dụng DTO cho request/response. Không expose trực tiếp Entity.
     - Bảo mật: Các endpoint cần được bảo vệ bằng Spring Security dựa trên Role (Admin, Nhân sự, Thủ kho, Quản đốc, Trưởng Ca/Kíp, Tổ trưởng).

4. **Các vai trò (Roles) trong hệ thống**
   - Nhân sự (HR): Quản lý phòng ban, nhân viên, tài khoản.
   - Thủ kho Vật tư: Quản lý danh mục vật tư, nhập/xuất kho.
   - Thủ kho CCDC: Quản lý công cụ dụng cụ, cho mượn/trả.
   - Quản đốc PX Vận hành: Quản lý hệ thống & thiết bị.
   - Trưởng Ca / Trưởng Kíp: Tạo yêu cầu sửa chữa, mở/đóng phiếu công tác.
   - Quản đốc Sửa chữa / Tổ trưởng: Tiếp nhận request, tạo phiếu công tác, phiếu cấp vật tư.
   - Tổ trưởng: Đánh giá kỹ thuật, quản lý dầu mỡ, lịch sử sửa chữa.
   - Admin: Toàn quyền hệ thống.

**Guiding Principles (Nguyên tắc Tự ra Quyết định):**
Khi đứng trước nhiều lựa chọn mà không có chỉ thị rõ ràng, bạn (Agent) BẮT BUỘC phải ưu tiên:
1. Tính nhất quán (Consistency): Frontend dùng functional components + hooks, Backend dùng constructor injection.
2. Chống lỗi (Fool-proof): Validate dữ liệu ở cả Frontend (Yup) và Backend (@Valid). Xử lý lỗi an toàn, không để lộ Stack Trace.
3. Tối ưu: Tránh lỗi N+1 Query (Backend), tránh re-render không cần thiết (Frontend).

**Sense Check (Kiểm chứng):**
Trước khi chốt phương án, hãy tự hỏi: "Logic này đã được tách ra service/hook chưa? Có validate dữ liệu đầu vào không? Component đã xử lý trường hợp loading/error/empty state chưa?". Nếu vi phạm, hãy tự động sửa đổi!
