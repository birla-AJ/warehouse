import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

const UPLOAD_URL_TTL_SECONDS = 300; // 5 minutes to complete the PUT

export interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Generates a presigned S3 PUT URL so the browser uploads the binary
 * directly to S3 — this API server never touches the file bytes.
 * Requires AWS_REGION, AWS_S3_BUCKET, and standard AWS credential env vars
 * (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY, or an attached IAM role in
 * production). Throws a clear error if not configured, rather than a
 * confusing SDK stack trace.
 */
export class S3Util {
  private static client: S3Client | null = null;

  private static getClient(): S3Client {
    if (!this.client) {
      const region = process.env.AWS_REGION;
      if (!region) {
        throw new Error('AWS_REGION is not configured — document upload requires AWS S3 setup (see README).');
      }
      this.client = new S3Client({ region });
    }
    return this.client;
  }

  static async createPresignedUpload(fileName: string, mimeType: string, prefix = 'documents'): Promise<PresignedUpload> {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured — document upload requires AWS S3 setup (see README).');
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType });
    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn: UPLOAD_URL_TTL_SECONDS });

    const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }
}
