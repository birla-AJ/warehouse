import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailProvider, SmsProvider, WhatsAppProvider, PushProvider } from './providers/stub-providers';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService, EmailProvider, SmsProvider, WhatsAppProvider, PushProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
