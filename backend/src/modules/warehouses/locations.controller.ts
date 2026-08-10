import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationNodeDto, CreatePositionDto, UpdatePositionStatusDto } from './dto/location.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('locations')
@Controller()
export class LocationsController {
  constructor(private service: LocationsService) {}

  @Post('warehouses/:warehouseId/zones')
  @Permissions({ module: 'warehouses', action: 'update' })
  createZone(@Param('warehouseId') warehouseId: string, @Body() dto: CreateLocationNodeDto) {
    return this.service.createZone(warehouseId, dto);
  }

  @Post('zones/:zoneId/blocks')
  @Permissions({ module: 'warehouses', action: 'update' })
  createBlock(@Param('zoneId') zoneId: string, @Body() dto: CreateLocationNodeDto) {
    return this.service.createBlock(zoneId, dto);
  }

  @Post('blocks/:blockId/rows')
  @Permissions({ module: 'warehouses', action: 'update' })
  createRow(@Param('blockId') blockId: string, @Body() dto: CreateLocationNodeDto) {
    return this.service.createRow(blockId, dto);
  }

  @Post('rows/:rowId/racks')
  @Permissions({ module: 'warehouses', action: 'update' })
  createRack(@Param('rowId') rowId: string, @Body() dto: CreateLocationNodeDto) {
    return this.service.createRack(rowId, dto);
  }

  @Post('racks/:rackId/levels')
  @Permissions({ module: 'warehouses', action: 'update' })
  createLevel(@Param('rackId') rackId: string, @Body() dto: CreateLocationNodeDto) {
    return this.service.createLevel(rackId, dto);
  }

  @Post('levels/:levelId/positions')
  @Permissions({ module: 'warehouses', action: 'update' })
  createPosition(@Param('levelId') levelId: string, @Body() dto: CreatePositionDto) {
    return this.service.createPosition(levelId, dto);
  }

  @Get('positions/:locationCode')
  @Permissions({ module: 'warehouses', action: 'read' })
  getPosition(@Param('locationCode') locationCode: string) {
    return this.service.getPositionByCode(locationCode);
  }

  @Patch('positions/:positionId/status')
  @Permissions({ module: 'warehouses', action: 'update' })
  setStatus(@Param('positionId') positionId: string, @Body() dto: UpdatePositionStatusDto) {
    return this.service.setPositionStatus(positionId, dto);
  }
}
