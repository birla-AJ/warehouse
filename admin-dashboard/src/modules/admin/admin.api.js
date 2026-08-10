import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useUsers(page, limit, search) {
  return useQuery({
    queryKey: ['users', page, limit, search],
    queryFn: () => apiClient.get('/users', { params: { page, limit, search } }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/users', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`/users/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: () => apiClient.get('/roles').then((r) => r.data) });
}

export function usePermissions() {
  return useQuery({ queryKey: ['permissions'], queryFn: () => apiClient.get('/permissions').then((r) => r.data) });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }) => apiClient.patch(`/roles/${roleId}/permissions`, { permissionIds }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}
