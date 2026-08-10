import { Module } from '@nestjs/common';
import { BagsController } from './bags.controller';
import { BagsService } from './bags.service';
import { BagsRepository } from './bags.repository';
import { PrismaService } from '../../database/prisma.service';
import { WarehousesModule } from '../warehouses/warehouses.module';

@Module({
  imports: [WarehousesModule],
  controllers: [BagsController],
  providers: [BagsService, BagsRepository, PrismaService],
  exports: [BagsService],
})
export class BagsModule {}
