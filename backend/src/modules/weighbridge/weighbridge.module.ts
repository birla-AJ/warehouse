import { Module } from '@nestjs/common';
import { WeighbridgeController } from './weighbridge.controller';
import { WeighbridgeService } from './weighbridge.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [WeighbridgeController],
  providers: [WeighbridgeService, PrismaService],
  exports: [WeighbridgeService],
})
export class WeighbridgeModule {}
