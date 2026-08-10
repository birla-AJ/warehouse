import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useCameras(warehouseId) {
  return useQuery({
    queryKey: ['cameras', warehouseId],
    queryFn: () => apiClient.get('/cameras', { params: { warehouseId } }).then((r) => r.data),
  });
}

export function useCreateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/cameras', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cameras'] }),
  });
}

export function useRequestSnapshot() {
  return useMutation({
    mutationFn: (id) => apiClient.post(`/cameras/${id}/snapshot`).then((r) => r.data),
  });
}
