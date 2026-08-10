import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useEmployees() {
  return useQuery({ queryKey: ['employees'], queryFn: () => apiClient.get('/employees').then((r) => r.data) });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/employees', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, ...payload }) => apiClient.post(`/employees/${employeeId}/attendance`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function useAttendance(params) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => apiClient.get('/attendance', { params }).then((r) => r.data),
  });
}

export function useLeaveRequests(params) {
  return useQuery({
    queryKey: ['leave-requests', params],
    queryFn: () => apiClient.get('/leave-requests', { params }).then((r) => r.data),
  });
}

export function useDecideLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/leave-requests/${id}/decide`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-requests'] }),
  });
}
