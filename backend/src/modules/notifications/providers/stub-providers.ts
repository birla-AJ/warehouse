import { Injectable, Logger } from '@nestjs/common';
import { NotificationProvider, NotificationSendResult } from './notification-provider.interface';

/**
 * Every provider below just logs — this is intentional. Swapping in a real
 * vendor (Twilio/MSG91 for SMS, SES/SendGrid for Email, WhatsApp Business
 * API, FCM for Push) means implementing NotificationProvider.send() and
 * changing one binding in NotificationsModule — nothing else in the app
 * needs to know a real provider now exists.
 */

@Injectable()
export class EmailProvider implements NotificationProvider {
  private readonly logger = new Logger('EmailProvider');

  async send(recipient: string, subject: string, body: string): Promise<NotificationSendResult> {
    this.logger.log(`[STUB] Email to ${recipient} — ${subject}: ${body}`);
    return { success: true };
  }
}

@Injectable()
export class SmsProvider implements NotificationProvider {
  private readonly logger = new Logger('SmsProvider');

  async send(recipient: string, subject: string, body: string): Promise<NotificationSendResult> {
    this.logger.log(`[STUB] SMS to ${recipient}: ${body}`);
    return { success: true };
  }
}

@Injectable()
export class WhatsAppProvider implements NotificationProvider {
  private readonly logger = new Logger('WhatsAppProvider');

  async send(recipient: string, subject: string, body: string): Promise<NotificationSendResult> {
    this.logger.log(`[STUB] WhatsApp to ${recipient}: ${body}`);
    return { success: true };
  }
}

@Injectable()
export class PushProvider implements NotificationProvider {
  private readonly logger = new Logger('PushProvider');

  async send(recipient: string, subject: string, body: string): Promise<NotificationSendResult> {
    this.logger.log(`[STUB] Push to device/user ${recipient} — ${subject}: ${body}`);
    return { success: true };
  }
}
