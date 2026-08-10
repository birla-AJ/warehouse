import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useInvoices(params) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => apiClient.get('/invoices', { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useInvoice(id) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => apiClient.get(`/invoices/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useBillingRules() {
  return useQuery({
    queryKey: ['billing-rules'],
    queryFn: () => apiClient.get('/billing/rules').then((r) => r.data),
  });
}

export function useCreateBillingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/billing/rules', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing-rules'] }),
  });
}

export function useGenerateInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/billing/generate', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
