/**
 * Tiện ích dùng chung cho việc xuất PDF của phiếu công tác / phiếu cấp vật tư.
 *
 * VÒNG ĐỜI FILE PDF (khớp backend):
 *  - Phiếu còn sống: backend render snapshot MỚI mỗi lần xuất → luôn gọi API.
 *  - Phiếu đã kết thúc (COMPLETED/CANCELLED): backend đã ĐÓNG BĂNG bản lưu trên
 *    Cloudinary (pdfPath) lúc đóng phiếu → mở thẳng URL đó, khỏi tốn một lượt render.
 */

/** Phiếu đã kết thúc → dữ liệu bất biến, bản PDF lưu sẵn là bản chốt. */
export function isTerminalStatus(status) {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/** Mở blob PDF (response axios responseType:'blob') trong tab mới. */
export function openPdfBlob(data) {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  window.open(url, '_blank');
  // Thu hồi sau 1 phút — tab mới đã kịp nạp nội dung.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Lấy message lỗi thật khi gọi API bằng responseType:'blob' — axios gói cả
 * body lỗi (JSON/string) vào Blob nên phải đọc lại bằng .text().
 */
export async function blobErrorMessage(err) {
  let msg = err.message || 'Lỗi không xác định';
  try {
    const text = await err.response?.data?.text?.();
    if (text) {
      try { msg = JSON.parse(text).message || text; } catch { msg = text; }
    }
  } catch { /* giữ msg mặc định */ }
  return msg;
}
