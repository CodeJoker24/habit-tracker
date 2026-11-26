import { api } from './api.js';

const payload = (response) => response.data.data;

export const getBadges = () => api.get('/badges').then(payload);
export const findBadgeUsers = (search) => api.get('/badges/users', { params: { search } }).then(payload);
export const createBadge = (values) => api.post('/badges', values).then(payload);
export const updateBadge = (id, values) => api.put(`/badges/${id}`, values).then(payload);
export const awardBadge = (id, userId) => api.post(`/badges/${id}/award`, { user_id: userId }).then(payload);
