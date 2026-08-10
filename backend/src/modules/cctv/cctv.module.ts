import { Module } from '@nestjs/common';
import { CctvController } from './cctv.controller';
import { CctvService } from './cctv.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CctvController],
  providers: [CctvService, PrismaService],
  exports: [CctvService],
})
export class CctvModule {}
