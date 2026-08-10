import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useFarmers(page, limit, search) {
  return useQuery({
    queryKey: ['farmers', page, limit, search],
    queryFn: () => apiClient.get('/farmers', { params: { page, limit, search } }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useFarmer(id) {
  return useQuery({
    queryKey: ['farmers', id],
    queryFn: () => apiClient.get(`/farmers/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateFarmer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/farmers', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmers'] }),
  });
}

export function useUpdateFarmer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`/farmers/${id}`, payload).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['farmers'] });
      qc.invalidateQueries({ queryKey: ['farmers', vars.id] });
    },
  });
}

export function useDeleteFarmer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/farmers/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmers'] }),
  });
}
