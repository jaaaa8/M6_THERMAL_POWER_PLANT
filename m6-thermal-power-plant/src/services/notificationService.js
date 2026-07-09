import apiClient from './apiClient';

const BASE = '/api/v1/notifications';

export const notificationService = {
  getByAccount: (accountId) => apiClient.get(`${BASE}/account/${accountId}`),
  countUnread: (accountId) => apiClient.get(`${BASE}/account/${accountId}/unread-count`),
  markRead: (id, accountId) => apiClient.patch(`${BASE}/${id}/read`, null, { params: { accountId } }),
  markAllRead: (accountId) => apiClient.patch(`${BASE}/account/${accountId}/read-all`),
};
