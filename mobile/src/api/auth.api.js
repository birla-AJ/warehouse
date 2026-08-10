import { apiClient } from './apiClient';

export function login({ identifier, password }) {
  const isEmail = identifier.includes('@');
  const payload = isEmail ? { email: identifier, password } : { mobile: identifier, password };
  return apiClient.post('/auth/login', payload).then((r) => r.data);
}

export function forgotPassword(email) {
  return apiClient.post('/auth/forgot-password', { email }).then((r) => r.data);
}

export function fetchMyPermissions() {
  return apiClient.get('/auth/permissions').then((r) => r.data);
}

export function changePassword({ currentPassword, newPassword }) {
  return apiClient.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data);
}
