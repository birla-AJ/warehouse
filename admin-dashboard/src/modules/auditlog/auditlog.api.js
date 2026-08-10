import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useAuditLogs(params) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => apiClient.get('/audit-logs', { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}
