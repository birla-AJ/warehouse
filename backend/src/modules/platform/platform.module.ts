import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [PlatformController],
  providers: [PlatformService, PrismaService],
})
export class PlatformModule {}
