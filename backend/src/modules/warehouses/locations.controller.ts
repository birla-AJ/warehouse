import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationNodeDto, CreateRackDto, UpdateRackStatusDto } from './dto/location.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('locations')
@Controller()
export class LocationsController {
  constructor(private service: LocationsService) {}

  @Post('warehouses/:warehouseId/floors')
  @Permissions({ module: 'warehouses', action: 'update' })
  createFloor(@Param('warehouseId') warehouseId: string, @Body() dto: CreateLocationNodeDto) {
    return this.service.createFloor(warehouseId, dto);
  }

  @Post('floors/:floorId/chambers')
  @Permissions({ module: 'warehouses', action: 'update' })
  createChamber(@Param('floorId') floorId: string, @Body() dto: CreateLocationNodeDto) {
    return this.service.createChamber(floorId, dto);
  }

  @Post('chambers/:chamberId/racks')
  @Permissions({ module: 'warehouses', action: 'update' })
  createRack(@Param('chamberId') chamberId: string, @Body() dto: CreateRackDto) {
    return this.service.createRack(chamberId, dto);
  }

  @Get('racks/:locationCode')
  @Permissions({ module: 'warehouses', action: 'read' })
  getRack(@Param('locationCode') locationCode: string) {
    return this.service.getRackByCode(locationCode);
  }

  @Patch('racks/:rackId/status')
  @Permissions({ module: 'warehouses', action: 'update' })
  setStatus(@Param('rackId') rackId: string, @Body() dto: UpdateRackStatusDto) {
    return this.service.setRackStatus(rackId, dto);
  }
}
