import { apiClient } from './apiClient';

/**
 * Fetches a PDF from an authenticated endpoint and opens it in a new tab.
 * Needed because these endpoints require a Bearer token — a plain <a href>
 * or window.open(url) can't attach it, so we fetch as a blob via apiClient
 * (which already attaches the token) and hand the browser an object URL.
 */
export async function openPdfInNewTab(path, filename = 'document.pdf') {
  const response = await apiClient.get(path, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank');
  // Popup blocked or unsupported — fall back to a forced download instead.
  if (!win) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Revoke after a delay so the new tab/download has time to actually load it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
