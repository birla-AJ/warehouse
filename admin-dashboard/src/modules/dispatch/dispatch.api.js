import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useDispatches(params) {
  return useQuery({
    queryKey: ['dispatches', params],
    queryFn: () => apiClient.get('/dispatch', { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useDispatch(id) {
  return useQuery({
    queryKey: ['dispatches', id],
    queryFn: () => apiClient.get(`/dispatch/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/dispatch', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispatches'] }),
  });
}

export function useVerifyDispatchOtp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, otp, scannedBagCodes }) =>
      apiClient.post(`/dispatch/${id}/verify-otp`, { otp, scannedBagCodes }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispatches'] }),
  });
}

export function useCancelDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/dispatch/${id}/cancel`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispatches'] }),
  });
}
