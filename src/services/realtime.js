import { io } from 'socket.io-client';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
const socketUrl = apiBase.startsWith('http') ? apiBase.replace(/\/api\/?$/, '') : window.location.origin;

let socket = null;
const listeners = new Map();

const bindListeners = () => {
  listeners.forEach((handlers, event) => {
    handlers.forEach((handler) => socket.on(event, handler));
  });
};

export const connectRealtime = (token) => {
  if (!token) return null;
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();
  socket = io(socketUrl, { auth: { token }, transports: ['websocket'] });
  bindListeners();
  return socket;
};

export const disconnectRealtime = () => {
  socket?.disconnect();
  socket = null;
};

export const onRealtime = (event, handler) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  socket?.on(event, handler);

  return () => {
    listeners.get(event)?.delete(handler);
    socket?.off(event, handler);
  };
};
