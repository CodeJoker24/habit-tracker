import { api } from './api.js';

const payload = (response) => response.data.data;

export const getAdminSummary = () => api.get('/admin/summary').then(payload);
export const getDeletionRequests = () => api.get('/admin/deletion-requests').then(payload);
export const deleteUserAccount = (id) => api.delete(`/admin/users/${id}`).then(payload);
