/* ============================================================
   Dữ liệu mẫu (sample/mock) cho module CCDC — chỉ dùng khi chưa
   kết nối được API thật, để xem trước giao diện.
   ============================================================ */

export const SAMPLE_CATEGORIES = [
  { id: 1, categoryCode: 'TC001', categoryName: 'Tháo lắp', description: 'Cờ lê, mỏ lết, tuýp, kìm...' },
  { id: 2, categoryCode: 'TC002', categoryName: 'Đo điện', description: 'Đồng hồ đo điện, ampe kìm, megomet...' },
  { id: 3, categoryCode: 'TC003', categoryName: 'Hàn cắt', description: 'Máy hàn, mỏ cắt, kính hàn...' },
  { id: 4, categoryCode: 'TC004', categoryName: 'An toàn lao động', description: 'Dây đai an toàn, mũ bảo hộ, găng tay cách điện...' },
];

export const SAMPLE_TOOLS = [
  {
    id: 1, toolCode: 'MCCDC-0001', name: 'Bộ cờ lê 12 món', toolCategoryId: 1, toolCategoryName: 'Tháo lắp',
    unit: 'Bộ', quantity: 8, quantityBorrowed: 3, quantityDamaged: 0, quantityAvailable: 5,
    note: 'Từ 8 đến 32mm',
  },
  {
    id: 2, toolCode: 'MCCDC-0002', name: 'Đồng hồ đo điện vạn năng', toolCategoryId: 2, toolCategoryName: 'Đo điện',
    unit: 'Bộ', quantity: 6, quantityBorrowed: 2, quantityDamaged: 1, quantityAvailable: 3,
    note: '',
  },
  {
    id: 3, toolCode: 'MCCDC-0003', name: 'Máy hàn điện cầm tay', toolCategoryId: 3, toolCategoryName: 'Hàn cắt',
    unit: 'Cái', quantity: 4, quantityBorrowed: 1, quantityDamaged: 0, quantityAvailable: 3,
    note: 'Công suất 200A',
  },
  {
    id: 4, toolCode: 'MCCDC-0004', name: 'Kìm bấm cos thuỷ lực', toolCategoryId: 1, toolCategoryName: 'Tháo lắp',
    unit: 'Cái', quantity: 5, quantityBorrowed: 0, quantityDamaged: 1, quantityAvailable: 4,
    note: '',
  },
  {
    id: 5, toolCode: 'MCCDC-0005', name: 'Ampe kìm đo dòng AC/DC', toolCategoryId: 2, toolCategoryName: 'Đo điện',
    unit: 'Cái', quantity: 3, quantityBorrowed: 1, quantityDamaged: 0, quantityAvailable: 2,
    note: '',
  },
  {
    id: 6, toolCode: 'MCCDC-0006', name: 'Dây đai an toàn toàn thân', toolCategoryId: 4, toolCategoryName: 'An toàn lao động',
    unit: 'Bộ', quantity: 12, quantityBorrowed: 4, quantityDamaged: 0, quantityAvailable: 8,
    note: 'Đạt chuẩn EN361',
  },
  {
    id: 7, toolCode: 'MCCDC-0007', name: 'Mỏ cắt khí Oxy-Gas', toolCategoryId: 3, toolCategoryName: 'Hàn cắt',
    unit: 'Bộ', quantity: 2, quantityBorrowed: 0, quantityDamaged: 0, quantityAvailable: 2,
    note: '',
  },
];

export const SAMPLE_BORROW_LOGS = [
  {
    id: 1, toolId: 1, toolCode: 'MCCDC-0001', toolName: 'Bộ cờ lê 12 món',
    accountId: 12, accountName: 'Nguyễn Văn Hải',
    quantity: 1, borrowPurpose: 'Sửa chữa bơm cấp nước thô', status: 'PENDING',
    transactionDate: '23/06/2026 08:10', deliveredDate: null,
    dueDate: '26/06/2026 17:00', actualReturnDate: null,
    returnNote: null, approvedById: null, approvedByName: null,
    overdueNotified: false, overdue: false,
  },
  {
    id: 2, toolId: 2, toolCode: 'MCCDC-0002', toolName: 'Đồng hồ đo điện vạn năng',
    accountId: 15, accountName: 'Trần Thị Mai',
    quantity: 2, borrowPurpose: 'Kiểm tra hệ thống điều khiển', status: 'APPROVED',
    transactionDate: '20/06/2026 09:30', deliveredDate: '20/06/2026 10:00',
    dueDate: '22/06/2026 17:00', actualReturnDate: null,
    returnNote: null, approvedById: 1, approvedByName: 'Lê Văn Kho',
    overdueNotified: true, overdue: true,
  },
  {
    id: 3, toolId: 3, toolCode: 'MCCDC-0003', toolName: 'Máy hàn điện cầm tay',
    accountId: 18, accountName: 'Phạm Quốc Huy',
    quantity: 1, borrowPurpose: 'Hàn khắc phục rò rỉ đường ống', status: 'APPROVED',
    transactionDate: '24/06/2026 07:00', deliveredDate: '24/06/2026 07:20',
    dueDate: '27/06/2026 17:00', actualReturnDate: null,
    returnNote: null, approvedById: 1, approvedByName: 'Lê Văn Kho',
    overdueNotified: false, overdue: false,
  },
  {
    id: 4, toolId: 4, toolCode: 'MCCDC-0004', toolName: 'Kìm bấm cos thuỷ lực',
    accountId: 12, accountName: 'Nguyễn Văn Hải',
    quantity: 1, borrowPurpose: 'Đấu nối cáp động lực', status: 'RETURNED',
    transactionDate: '15/06/2026 08:00', deliveredDate: '15/06/2026 08:15',
    dueDate: '17/06/2026 17:00', actualReturnDate: '17/06/2026 16:30',
    returnNote: 'CCDC còn tốt, đầy đủ phụ kiện', approvedById: 1, approvedByName: 'Lê Văn Kho',
    overdueNotified: false, overdue: false,
  },
  {
    id: 5, toolId: 6, toolCode: 'MCCDC-0006', toolName: 'Dây đai an toàn toàn thân',
    accountId: 20, accountName: 'Võ Thành Đạt',
    quantity: 2, borrowPurpose: 'Làm việc trên cao tại lò hơi phụ', status: 'REJECTED',
    transactionDate: '21/06/2026 14:00', deliveredDate: null,
    dueDate: '24/06/2026 17:00', actualReturnDate: null,
    returnNote: 'Hết hàng khả dụng tại thời điểm duyệt', approvedById: 1, approvedByName: 'Lê Văn Kho',
    overdueNotified: false, overdue: false,
  },
];
