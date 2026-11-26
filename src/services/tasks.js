import { api } from './api.js';

const payload = (response) => response.data.data;

export const getTasks = (filters = {}) => api.get('/tasks', { params: filters }).then(payload);
export const getTask = (id) => api.get(`/tasks/${id}`).then(payload);
export const createTask = (values, headers) => api.post('/tasks', values, { headers }).then(payload);
export const updateTask = (id, values, headers) => api.put(`/tasks/${id}`, values, { headers }).then(payload);
export const setTaskStatus = (id, status, headers) =>
  api.patch(`/tasks/${id}/status`, { status }, { headers }).then(payload);
export const deleteTask = (id, headers) => api.delete(`/tasks/${id}`, { headers }).then(payload);
