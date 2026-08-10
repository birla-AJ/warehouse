import { Module } from '@nestjs/common';
import { FarmersController } from './farmers.controller';
import { FarmersService } from './farmers.service';
import { FarmersRepository } from './farmers.repository';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [FarmersController],
  providers: [FarmersService, FarmersRepository, PrismaService],
  exports: [FarmersService],
})
export class FarmersModule {}
