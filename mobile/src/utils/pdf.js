import { Platform, Share } from 'react-native';
import RNFS from 'react-native-fs';
import { apiClient } from '../api/apiClient';
import { arrayBufferToBase64 } from './base64';

/**
 * Fetches a PDF from an authenticated backend endpoint and opens the
 * device's native share sheet for it (which on both platforms lets the
 * user "Open in..." any installed PDF viewer, print it, or share it
 * onward — friendlier than trying to guess a single default viewer).
 *
 * Previous version of this function built a `data:application/pdf;base64,…`
 * URL and passed it to `Linking.openURL()`. That's fine for a demo, but
 * has two real problems in production:
 *  1. iOS frequently reports `canOpenURL(dataUrl) === false` for data: URIs
 *     even when opening would have worked, so the old code's `canOpen`
 *     check false-negatives and blocks the open entirely on iOS.
 *  2. The whole PDF has to live in memory twice over (as an ArrayBuffer,
 *     then again as a base64 string) — fine for a one-page invoice, but a
 *     multi-page report with embedded images would visibly stall the JS
 *     thread building that string.
 *
 * Writing to disk via react-native-fs (already a dependency, no new
 * native linking required) and sharing the resulting file:// URI avoids
 * both: the file is written once, and the OS share sheet is what actually
 * resolves a viewer instead of us guessing via canOpenURL.
 *
 * KNOWN CAVEAT — Android FileProvider: some OEM builds on Android 7+
 * (API 24+) with strict StrictMode policies reject a raw file:// URI
 * handed to another app (FileUriExposedException) and expect a
 * content:// URI instead, which requires declaring a <provider> +
 * file_paths.xml in AndroidManifest.xml (a native-project change, not a
 * JS one). Stock React Native's Share module handles this correctly on
 * most devices as of recent Android versions, but if you see a crash
 * report mentioning FileUriExposedException on a specific OEM/Android
 * version, that's the fix: add a FileProvider entry to
 * android/app/src/main/AndroidManifest.xml.
 */
export async function openPdf(path, filename = 'document.pdf') {
  const response = await apiClient.get(path, { responseType: 'arraybuffer' });
  const base64 = arrayBufferToBase64(response.data);

  const targetDir = Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : RNFS.CachesDirectoryPath;
  const filePath = `${targetDir}/${filename}`;

  await RNFS.writeFile(filePath, base64, 'base64');

  const fileUri = Platform.OS === 'ios' ? filePath : `file://${filePath}`;

  try {
    await Share.share(
      Platform.OS === 'ios' ? { url: fileUri } : { url: fileUri, message: filename },
      { subject: filename },
    );
  } catch (shareError) {
    // Share.share rejects if the user just dismisses the sheet — that's a
    // normal cancel, not a real failure, and callers shouldn't show an
    // error toast for it.
    if (shareError?.message !== 'User did not share') {
      throw shareError;
    }
  }
  // Deliberately not deleting filePath here: Share.share() resolving only
  // means the share sheet action was dispatched, not that the receiving
  // app (e.g. a PDF viewer opened via "Open In...") has finished reading
  // the file — deleting immediately risks a race where that app opens a
  // file that's already gone. Both TemporaryDirectoryPath and
  // CachesDirectoryPath are OS-managed and get purged automatically under
  // storage/memory pressure, so leaving cleanup to the OS is the safer
  // default here.
}
