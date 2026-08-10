import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useCrops() {
  return useQuery({ queryKey: ['crops'], queryFn: () => apiClient.get('/crops').then((r) => r.data) });
}

export function useCreateCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/crops', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crops'] }),
  });
}

export function useBagTypes() {
  return useQuery({ queryKey: ['bag-types'], queryFn: () => apiClient.get('/bag-types').then((r) => r.data) });
}

export function useCreateBagType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/bag-types', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-types'] }),
  });
}
