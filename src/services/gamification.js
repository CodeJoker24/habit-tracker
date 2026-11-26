import { api } from './api.js';

const payload = (response) => response.data.data;

export const getGamification = () => api.get('/gamification/overview').then(payload);
export const recomputeGamification = () => api.post('/gamification/recompute').then(payload);
export const markNotificationRead = (id) =>
  api.patch(`/gamification/notifications/${id}/read`).then(payload);
export const markAllNotificationsRead = () =>
  api.post('/gamification/notifications/read-all').then(payload);
