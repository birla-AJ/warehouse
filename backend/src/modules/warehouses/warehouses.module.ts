import { Module } from '@nestjs/common';
import { WarehousesController } from './warehouses.controller';
import { LocationsController } from './locations.controller';
import { WarehousesService } from './warehouses.service';
import { LocationsService } from './locations.service';
import { WarehousesRepository } from './warehouses.repository';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [WarehousesController, LocationsController],
  providers: [WarehousesService, LocationsService, WarehousesRepository, PrismaService],
  exports: [WarehousesService, LocationsService],
})
export class WarehousesModule {}
