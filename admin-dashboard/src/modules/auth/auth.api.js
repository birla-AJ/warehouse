import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAppDispatch } from '../../hooks/redux';
import { setSession, logout as logoutAction, setPermissions } from '../../app/slices/authSlice';

export function useLogin() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data),
    onSuccess: (data) => dispatch(setSession(data)),
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (mobile) => apiClient.post('/auth/login/otp/request', { mobile }).then((r) => r.data),
  });
}

export function useVerifyOtp() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/auth/login/otp/verify', payload).then((r) => r.data),
    onSuccess: (data) => dispatch(setSession(data)),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email) => apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload) => apiClient.post('/auth/reset-password', payload).then((r) => r.data),
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ['auth', 'devices'],
    queryFn: () => apiClient.get('/auth/devices').then((r) => r.data),
  });
}

export function useRevokeDevice() {
  return useMutation({
    mutationFn: (deviceId) => apiClient.delete(`/auth/devices/${deviceId}`).then((r) => r.data),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload) => apiClient.post('/auth/change-password', payload).then((r) => r.data),
  });
}

export function useMyPermissions(enabled) {
  const dispatch = useAppDispatch();
  return useQuery({
    queryKey: ['auth', 'permissions'],
    queryFn: () =>
      apiClient.get('/auth/permissions').then((r) => {
        dispatch(setPermissions(r.data));
        return r.data;
      }),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  return () => dispatch(logoutAction());
}
