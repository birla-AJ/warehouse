import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useBags(params) {
  return useQuery({
    queryKey: ['bags', params],
    queryFn: () => apiClient.get('/bags', { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useBag(id) {
  return useQuery({
    queryKey: ['bags', id],
    queryFn: () => apiClient.get(`/bags/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useResolveQr(code) {
  return useQuery({
    queryKey: ['qr', code],
    queryFn: () => apiClient.get(`/qr/${code}/resolve`).then((r) => r.data),
    enabled: !!code,
    retry: false,
  });
}

export function useCreateBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/bags', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bags'] }),
  });
}

export function useMoveBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`/bags/${id}/move`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bags'] }),
  });
}

export function useDamageBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`/bags/${id}/damage`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bags'] }),
  });
}

export function useAdjustBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`/bags/${id}/adjust`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bags'] }),
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: () => apiClient.get('/inventory/summary').then((r) => r.data),
  });
}

export function useInventoryMovements(params) {
  return useQuery({
    queryKey: ['inventory', 'movements', params],
    queryFn: () => apiClient.get('/inventory/movements', { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useQualityReports(bagId) {
  return useQuery({
    queryKey: ['quality-reports', bagId],
    queryFn: () => apiClient.get('/quality-reports', { params: { bagId } }).then((r) => r.data),
    enabled: !!bagId,
  });
}

export function useCreateQualityReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bagId, ...payload }) => apiClient.post(`/bags/${bagId}/quality-reports`, payload).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['quality-reports', vars.bagId] });
      qc.invalidateQueries({ queryKey: ['bags', vars.bagId] });
    },
  });
}
