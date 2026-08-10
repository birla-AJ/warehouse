import { Module } from '@nestjs/common';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { PrismaService } from '../../database/prisma.service';
import { BagsModule } from '../bags/bags.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [BagsModule, NotificationsModule],
  controllers: [DispatchController],
  providers: [DispatchService, PrismaService],
  exports: [DispatchService],
})
export class DispatchModule {}
