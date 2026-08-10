import * as crypto from 'crypto';

/**
 * Generates the opaque token encoded into a bag's printed QR code.
 * Resolution happens server-side via GET /qr/:code/resolve — the token
 * itself carries no data, it's just a unique lookup key, so nothing
 * sensitive is exposed if the QR image is photographed by a third party.
 */
export class QrUtil {
  static generateToken(bagCode: string): string {
    const random = crypto.randomBytes(6).toString('hex');
    return `AWMS-${bagCode}-${random}`.toUpperCase();
  }
}
