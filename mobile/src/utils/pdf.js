import { Linking, Platform } from 'react-native';
import { apiClient } from '../api/apiClient';
import { arrayBufferToBase64 } from './base64';

/**
 * Fetches a PDF from an authenticated backend endpoint and opens it in the
 * device's PDF viewer.
 *
 * NOTE: this uses a base64 data: URL, which works well for typical
 * single-page slip/invoice/gate-pass PDFs (a few hundred KB) without adding
 * a native file-system dependency. If your invoices grow large (many pages,
 * embedded images), swap this for `react-native-blob-util` or
 * `react-native-fs` to write to disk and open via a `file://` / content URI
 * instead — the API surface below (`openPdf(path, filename)`) would stay
 * the same for callers.
 */
export async function openPdf(path, filename = 'document.pdf') {
  const response = await apiClient.get(path, { responseType: 'arraybuffer' });
  const base64 = arrayBufferToBase64(response.data);
  const dataUrl = `data:application/pdf;base64,${base64}`;

  const canOpen = await Linking.canOpenURL(dataUrl).catch(() => false);
  if (Platform.OS === 'android' || canOpen) {
    await Linking.openURL(dataUrl);
  } else {
    throw new Error('No PDF viewer available on this device');
  }
}
