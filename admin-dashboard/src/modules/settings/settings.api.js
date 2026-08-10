import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => apiClient.get('/settings').then((r) => r.data) });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }) => apiClient.patch(`/settings/${key}`, { value }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
