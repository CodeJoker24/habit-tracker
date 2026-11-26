import { api } from './api.js';

const payload = (response) => response.data.data;

export const getHabits = () => api.get('/habits').then(payload);
export const getHabit = (id) => api.get(`/habits/${id}`).then(payload);
export const createHabit = (values, headers) => api.post('/habits', values, { headers }).then(payload);
export const updateHabit = (id, values, headers) => api.put(`/habits/${id}`, values, { headers }).then(payload);
export const deleteHabit = (id, headers) => api.delete(`/habits/${id}`, { headers }).then(payload);
export const getCompletions = () => api.get('/habits/completions').then(payload);
export const addCompletion = (habitId, completedOn, headers) =>
  api.post('/habits/completions', { habit_id: habitId, completed_on: completedOn }, { headers }).then(payload);
export const removeCompletion = (habitId, completedOn, headers) =>
  api.delete('/habits/completions', { data: { habit_id: habitId, completed_on: completedOn }, headers }).then(payload);
