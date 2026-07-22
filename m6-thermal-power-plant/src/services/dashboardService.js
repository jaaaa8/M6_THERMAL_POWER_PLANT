import api from './apiClient';

/**
 * Lấy tổng hợp dữ liệu Dashboard (KPI cards, charts, bảng gần nhất).
 * Backend: GET /api/dashboard/summary
 */
export const getDashboardSummary = async () => {
  const response = await api.get('/api/dashboard/summary');
  return response.data;
};
