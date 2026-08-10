import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useNotifications(params) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => apiClient.get('/notifications', { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}
