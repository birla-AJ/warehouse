import { apiClient } from './apiClient';

// ── Dashboard ──────────────────────────────────────────────
export function fetchDashboardSummary() {
  return apiClient.get('/dashboard/summary').then((r) => r.data);
}

// ── Bags ───────────────────────────────────────────────────
export function fetchBags(params) {
  return apiClient.get('/bags', { params }).then((r) => r.data);
}

export function fetchBagByQr(qrCode) {
  return apiClient.get(`/bags/qr/${qrCode}`).then((r) => r.data);
}

// ── Invoices ───────────────────────────────────────────────
export function fetchInvoices(params) {
  return apiClient.get('/invoices', { params }).then((r) => r.data);
}

export function fetchInvoicePdfUrl(id) {
  return `/invoices/${id}/pdf`;
}

// ── Dispatch ───────────────────────────────────────────────
export function fetchDispatches(params) {
  return apiClient.get('/dispatch', { params }).then((r) => r.data);
}

// ── Warehouses ─────────────────────────────────────────────
export function fetchWarehouses(params) {
  return apiClient.get('/warehouses', { params }).then((r) => r.data);
}

// ── Farmers ────────────────────────────────────────────────
export function fetchFarmers(params) {
  return apiClient.get('/farmers', { params }).then((r) => r.data);
}

// ── Reports ────────────────────────────────────────────────
/** responseType 'arraybuffer' — axios's 'blob' type isn't reliable on React Native. */
export function downloadReport(key, format) {
  return apiClient
    .get(`/reports/${key}`, { params: { format }, responseType: 'arraybuffer' })
    .then((r) => r.data);
}
