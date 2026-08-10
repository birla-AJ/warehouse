import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailProvider, SmsProvider, WhatsAppProvider, PushProvider } from './providers/stub-providers';
import { NotificationChannel, ListNotificationsQueryDto } from './dto/notification.dto';

export interface SendNotificationInput {
  channel: NotificationChannel;
  recipient: string;
  type: string;
  subject?: string;
  body: string;
  userId?: string;
  farmerId?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
    private whatsAppProvider: WhatsAppProvider,
    private pushProvider: PushProvider,
  ) {}

  /**
   * Fire-and-forget by design: a notification failure must never break the
   * calling flow (OTP issuance, invoice generation, dispatch completion).
   * Every attempt — success or failure — is recorded for the notification
   * center / audit trail.
   */
  async send(input: SendNotificationInput) {
    const provider = this.resolveProvider(input.channel);

    let status = 'PENDING';
    let error: string | undefined;

    try {
      const result = await provider.send(input.recipient, input.subject ?? input.type, input.body);
      status = result.success ? 'SENT' : 'FAILED';
      error = result.error;
    } catch (e: any) {
      status = 'FAILED';
      error = e?.message ?? 'Unknown error';
      this.logger.warn(`Notification send failed (${input.channel}/${input.type}): ${error}`);
    }

    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        farmerId: input.farmerId,
        channel: input.channel,
        type: input.type,
        recipient: input.recipient,
        payload: (input.payload ?? {}) as any,
        status,
        error,
      },
    });
  }

  list(query: ListNotificationsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.farmerId ? { farmerId: query.farmerId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    return Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]).then(([items, total]) => ({ items, meta: { page, limit, total } }));
  }

  private resolveProvider(channel: NotificationChannel) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailProvider;
      case NotificationChannel.SMS:
        return this.smsProvider;
      case NotificationChannel.WHATSAPP:
        return this.whatsAppProvider;
      case NotificationChannel.PUSH:
        return this.pushProvider;
    }
  }
}
