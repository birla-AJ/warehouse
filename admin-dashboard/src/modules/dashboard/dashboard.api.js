import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiClient.get('/dashboard/summary').then((r) => r.data),
    refetchInterval: 60_000,
  });
}
