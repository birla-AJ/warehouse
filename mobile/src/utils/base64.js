/** Converts a binary ArrayBuffer to a base64 string — needed since RN has no native atob/btoa-friendly Blob-to-file pipeline out of the box. */
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // eslint-disable-next-line no-undef
  return typeof global.btoa === 'function' ? global.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}
