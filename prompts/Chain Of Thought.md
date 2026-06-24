# Tiêu chuẩn Tư duy Thiết kế (Chain of Thought)

Trước khi viết hoặc sửa đổi code, bạn (AI Agent) BẮT BUỘC phải viết ra quá trình suy luận từng bước. Điều này giúp đảm bảo logic không có sai sót, cấu trúc mã nguồn nhất quán và an toàn.

Hãy suy luận theo các bước sau và ghi rõ ra trong kế hoạch (Implementation Plan):

1. **Phân tích Cấu trúc Dữ liệu (Database & Entity/DTO):**
   - *Suy nghĩ:* Tính năng này cần thêm/sửa Entity nào ở Backend? Thuộc tính là gì?
   - *Suy nghĩ:* Quan hệ giữa các Entity (`@OneToMany`, `@ManyToOne`) đã cấu hình chính xác chưa? Có cần fetch type `LAZY` không?
   - *Suy nghĩ:* DTO request/response cần những field nào? Có cần tạo DTO riêng cho create và update không?
   - *Kết luận:* Đưa ra quyết định về cấu trúc Entity, DTO và cơ sở dữ liệu.

2. **Phân tích Logic Backend (Controller REST, Service, Repository):**
   - *Suy nghĩ:* Request từ Frontend sẽ được Controller nào tiếp nhận? Method là GET, POST, PUT hay DELETE?
   - *Suy nghĩ:* Dữ liệu đầu vào sẽ được map vào DTO nào? Validation (`@Valid`, `@NotNull`, `@NotBlank`) ra sao?
   - *Suy nghĩ:* Business logic nào cần đặt trong Service? Có cần `@Transactional` để đảm bảo rollback khi có lỗi không?
   - *Suy nghĩ:* Response trả về Frontend có format thống nhất không? (ví dụ: `{ data, message, status }`)
   - *Kết luận:* Mô tả ngắn gọn luồng dữ liệu (Data Flow) từ API Request → Controller → Service → Repository → Response.

3. **Phân tích Giao diện Frontend (React Components & Pages):**
   - *Suy nghĩ:* Component nào cần tạo mới? Có thể tái sử dụng component hiện có không?
   - *Suy nghĩ:* State management dùng gì? (useState, useContext, hay cần state manager riêng?)
   - *Suy nghĩ:* API service call đặt ở đâu? (thư mục `services/`, dùng Axios)
   - *Suy nghĩ:* Form validation dùng Formik + Yup schema ra sao?
   - *Suy nghĩ:* Các trạng thái UI cần xử lý: Loading, Error, Empty state, Success notification (React Toastify).
   - *Kết luận:* Đưa ra quyết định thiết kế component và luồng tương tác UI.

4. **Dự báo Lỗi và Bảo mật (Edge Cases & Security):**
   - *Suy nghĩ:* Nếu user nhập dữ liệu sai hoặc để trống, Yup validation báo lỗi thế nào?
   - *Suy nghĩ:* Backend trả lỗi (400, 401, 403, 404, 500) thì Frontend xử lý ra sao?
   - *Suy nghĩ:* User không có quyền (ví dụ Role Trưởng Ca không được vào trang Admin) thì chặn ở đâu? (Protected Route + Backend authorization)
   - *Suy nghĩ:* Xử lý ngoại lệ (Exception Handling) ở Backend đã thân thiện chưa, hay đang văng Stack Trace qua API?
   - *Kết luận:* Đưa ra giải pháp phòng ngừa lỗi và đảm bảo bảo mật.
