import axios from 'axios';
import { getAccessToken } from './authToken.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((request) => {
  const token = getAccessToken();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : error.response?.data?.message || error.message || 'Something went wrong';
    const wrapped = new Error(message);
    wrapped.status = error.response?.status;
    wrapped.details = error.response?.data?.details;
    return Promise.reject(wrapped);
  },
);
