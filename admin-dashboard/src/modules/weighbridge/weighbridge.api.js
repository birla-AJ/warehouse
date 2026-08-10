import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useWeighbridgeEntries(params) {
  return useQuery({
    queryKey: ['weighbridge', params],
    queryFn: () => apiClient.get('/weighbridge/entries', { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useCreateWeighbridgeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/weighbridge/entries', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weighbridge'] }),
  });
}
