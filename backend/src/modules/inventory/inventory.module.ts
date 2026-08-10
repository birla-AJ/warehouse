import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { BagsModule } from '../bags/bags.module';

@Module({
  imports: [BagsModule],
  controllers: [InventoryController],
})
export class InventoryModule {}
