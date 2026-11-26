import { api } from './api.js';
import { supabase } from './supabase.js';

const payload = (response) => response.data.data;

export const getProfile = () => api.get('/profile').then(payload);
export const getProfileOverview = () => api.get('/profile/overview').then(payload);
export const getPublicProfile = (username) => api.get(`/profile/public/${username}`).then(payload);
export const updateProfile = (values) => api.put('/profile', values).then(payload);
export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  return api.post('/profile/avatar', form).then(payload);
};
export const requestAccountDeletion = () => api.post('/profile/deletion-request').then(payload);

export const changePassword = async (password) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
};

export const changeEmail = async (email) => {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw new Error(error.message);
};
