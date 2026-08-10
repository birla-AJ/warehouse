import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutes — rejects stale/replayed requests

/**
 * Verifies inbound webhooks from camera hardware / an external health-check
 * worker that cannot hold a JWT (they're not a logged-in dashboard user).
 *
 * Contract the caller must satisfy (document this for whoever configures the
 * NVR / health-check worker):
 *   Headers:
 *     x-webhook-timestamp: <unix ms>
 *     x-webhook-signature: hex(HMAC_SHA256(WEBHOOK_HMAC_SECRET, `${resourceId}.${timestamp}.${rawJsonBody}`))
 *
 * Replaces the previous @Public()-with-no-verification setup (see backend
 * README TODO). Falls back to rejecting every request if WEBHOOK_HMAC_SECRET
 * isn't configured, rather than silently allowing unsigned traffic.
 */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = process.env.WEBHOOK_HMAC_SECRET;

    if (!secret) {
      throw new UnauthorizedException(
        'WEBHOOK_HMAC_SECRET is not configured on the server — webhook rejected',
      );
    }

    const signature = request.headers['x-webhook-signature'];
    const timestamp = request.headers['x-webhook-timestamp'];
    const resourceId = request.params?.id;

    if (!signature || !timestamp) {
      throw new UnauthorizedException('Missing webhook signature headers');
    }

    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_CLOCK_SKEW_MS) {
      throw new UnauthorizedException('Webhook timestamp is missing, invalid, or expired');
    }

    const payload = `${resourceId}.${timestamp}.${JSON.stringify(request.body ?? {})}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const providedBuf = Buffer.from(String(signature), 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');

    const valid =
      providedBuf.length === expectedBuf.length && crypto.timingSafeEqual(providedBuf, expectedBuf);

    if (!valid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
