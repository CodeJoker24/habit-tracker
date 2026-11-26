import { api } from './api.js';

const payload = (response) => response.data.data;

export const getSessions = () => api.get('/timer/sessions').then(payload);
export const saveSession = (values, headers) => api.post('/timer/sessions', values, { headers }).then(payload);
export const getAnalytics = () => api.get('/analytics/overview').then(payload);
