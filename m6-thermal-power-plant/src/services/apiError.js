/**
 * Trích thông báo lỗi từ response, chịu được CẢ 2 dạng body của backend:
 *  - ApiResponse JSON: { message, errorCode, ... }
 *  - ResponseEntity<String>: body là chuỗi thuần (VD handleIllegalState / handleObjectNotFound)
 * Nếu chỉ đọc err.response.data.message thì dạng chuỗi thuần sẽ ra undefined → nuốt mất lý do thật.
 */
export const getApiErrorMessage = (err, fallback = 'Có lỗi xảy ra') => {
  const d = err?.response?.data;
  if (d?.message) return d.message;
  if (typeof d === 'string' && d.trim()) return d;
  return fallback;
};
