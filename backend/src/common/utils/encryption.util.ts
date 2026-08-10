import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Encrypts/decrypts sensitive fields (Aadhaar, bank account numbers, camera
 * passwords, etc.) at rest. Requires ENCRYPTION_KEY env var: a 32-byte key,
 * hex-encoded (64 hex chars). Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export class EncryptionUtil {
  private static getKey(): Buffer {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY env var must be a 64-character hex string (32 bytes). ' +
          'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }
    return Buffer.from(hex, 'hex');
  }

  /** Returns `iv:authTag:ciphertext`, all hex-encoded, joined with ':'. */
  static encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':');
  }

  static decrypt(payload: string): string {
    const [ivHex, authTagHex, ciphertextHex] = payload.split(':');
    if (!ivHex || !authTagHex || !ciphertextHex) {
      throw new Error('Malformed encrypted payload');
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, this.getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, 'hex')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }

  /** Masks a decrypted value for display, e.g. Aadhaar → "XXXX-XXXX-1234". */
  static maskLast4(value: string): string {
    const last4 = value.slice(-4);
    return `${'X'.repeat(Math.max(0, value.length - 4))}${last4}`;
  }
}
