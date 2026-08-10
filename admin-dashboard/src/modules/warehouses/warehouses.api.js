import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useWarehouses(page, limit) {
  return useQuery({
    queryKey: ['warehouses', page, limit],
    queryFn: () => apiClient.get('/warehouses', { params: { page, limit } }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useWarehouse(id) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => apiClient.get(`/warehouses/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useWarehouseLayout(id) {
  return useQuery({
    queryKey: ['warehouses', id, 'layout'],
    queryFn: () => apiClient.get(`/warehouses/${id}/layout`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/warehouses', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`/warehouses/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/warehouses/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

// ── Location hierarchy ──────────────────────────────────────
function invalidateLayout(qc, warehouseId) {
  qc.invalidateQueries({ queryKey: ['warehouses', warehouseId, 'layout'] });
}

export function useCreateZone(warehouseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post(`/warehouses/${warehouseId}/zones`, payload).then((r) => r.data),
    onSuccess: () => invalidateLayout(qc, warehouseId),
  });
}

export function useCreateBlock(warehouseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, ...payload }) => apiClient.post(`/zones/${zoneId}/blocks`, payload).then((r) => r.data),
    onSuccess: () => invalidateLayout(qc, warehouseId),
  });
}

export function useCreateRow(warehouseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, ...payload }) => apiClient.post(`/blocks/${blockId}/rows`, payload).then((r) => r.data),
    onSuccess: () => invalidateLayout(qc, warehouseId),
  });
}

export function useCreateRack(warehouseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rowId, ...payload }) => apiClient.post(`/rows/${rowId}/racks`, payload).then((r) => r.data),
    onSuccess: () => invalidateLayout(qc, warehouseId),
  });
}

export function useCreateLevel(warehouseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rackId, ...payload }) => apiClient.post(`/racks/${rackId}/levels`, payload).then((r) => r.data),
    onSuccess: () => invalidateLayout(qc, warehouseId),
  });
}

export function useCreatePosition(warehouseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ levelId, ...payload }) => apiClient.post(`/levels/${levelId}/positions`, payload).then((r) => r.data),
    onSuccess: () => invalidateLayout(qc, warehouseId),
  });
}

export function useSetPositionStatus(warehouseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ positionId, status }) => apiClient.patch(`/positions/${positionId}/status`, { status }).then((r) => r.data),
    onSuccess: () => invalidateLayout(qc, warehouseId),
  });
}
