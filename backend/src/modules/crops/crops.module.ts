import { Module } from '@nestjs/common';
import { CropsController } from './crops.controller';
import { CropsService } from './crops.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [CropsController],
  providers: [CropsService, PrismaService],
  exports: [CropsService],
})
export class CropsModule {}
