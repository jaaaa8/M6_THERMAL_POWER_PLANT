# 🤖 QUY TẮC BẮT BUỘC DÀNH CHO AI AGENT (RULE.MD)

Tài liệu này chứa các quy tắc TỐI THƯỢNG mà mọi AI Agent BẮT BUỘC PHẢI TUÂN THỦ trong suốt quá trình làm việc trên dự án này.

## 1. KHÔNG LÀM ẢNH HƯỞNG HOẶC TỰ Ý SỬA ĐỔI CODE CŨ
- **Bảo toàn Code Cũ:** Tuyệt đối KHÔNG ĐƯỢC tự ý sửa đổi, xóa, hoặc viết đè lên các đoạn code, logic, giao diện đã có sẵn của dự án trừ khi người dùng (USER) yêu cầu cụ thể và cấp phép rõ ràng.
- **Nguyên tắc Mở-Đóng (Open-Closed):** Khi phát triển tính năng mới, hãy ưu tiên mở rộng (thêm component mới, thêm file mới, thêm hook/service mới) thay vì sửa trực tiếp vào logic cũ đang hoạt động tốt.
- **Bảo vệ Hệ thống:** Không làm hỏng hoặc phá vỡ các chức năng hiện có. Nếu việc thêm mới bắt buộc phải thay đổi luồng của code cũ, phải thông báo và phân tích rủi ro cho người dùng trước khi tiến hành.

## 2. LƯU TRỮ NGỮ CẢNH (CONTEXT) VÀO THƯ MỤC `docs/`
- **Cập nhật Bắt buộc:** Bất cứ khi nào AI thực hiện các công việc như: cập nhật tính năng, sửa lỗi (bug fixes), tái cấu trúc (refactoring), hoặc thêm chức năng mới, AI **PHẢI GHI CHÚ LẠI** vào tệp lịch sử/ngữ cảnh nằm trong thư mục `docs/` (Ví dụ: file `docs/CHANGELOG.md` hoặc `docs/PROJECT_STATE.md`).
- **Mục đích:** Để các Agent trong các phiên làm việc (sessions) tương lai chỉ cần đọc thư mục `docs/` là có thể nhanh chóng nắm bắt được bối cảnh hiện tại của dự án, các file vừa thay đổi, tránh việc phải đọc dò lại toàn bộ source code (giúp tiết kiệm thời gian và token).
- **Yêu cầu khi ghi chú:** Phải ghi rõ Ngày cập nhật, Tính năng/Lỗi đã xử lý, Các file đã bị tác động, và Tóm tắt thay đổi logic ngắn gọn.

## 3. CÁC QUY TẮC LÀM VIỆC CỐT LÕI KHÁC
- **Luôn Kiểm Chứng & An Toàn:** Đừng vội vàng xác nhận đã hoàn thành nếu chưa xem xét lại kỹ càng luồng logic. Chống lỗi (Fool-proof) trong từng dòng code.
- **Đọc kỹ Hướng dẫn Dự án:** Hãy tham khảo các file hướng dẫn chuẩn mực trong thư mục `prompts/` (như `Chain Of Thought.md`, `Few-Shot.md`, `Project Context.md`) để code đúng chuẩn, đúng tech stack của dự án (React + Vite, Spring Boot REST API).
- **Tuyệt đối không tự biên tự diễn:** Khi thông tin đầu vào bị thiếu, mơ hồ, hoặc có sự mâu thuẫn lớn, hãy DỪNG LẠI và hỏi người dùng để xác nhận, thay vì tự đoán và viết ra code sai lệch.
- **Quản lý Configuration:** Không tự ý thay đổi version, cấu hình tại các file trọng yếu như `package.json`, `vite.config.js`, `build.gradle`, `application.properties` trừ khi được yêu cầu.
