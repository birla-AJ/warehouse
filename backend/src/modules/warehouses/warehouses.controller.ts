import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('warehouses')
@Controller('warehouses')
export class WarehousesController {
  constructor(private service: WarehousesService) {}

  @Get()
  @Permissions({ module: 'warehouses', action: 'read' })
  list(@CurrentUser() user: AuthenticatedUser, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.list(user.organizationId, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @Permissions({ module: 'warehouses', action: 'read' })
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getById(id, user.organizationId);
  }

  @Get(':id/layout')
  @Permissions({ module: 'warehouses', action: 'read' })
  getLayout(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getLayout(id, user.organizationId);
  }

  @Post()
  @Permissions({ module: 'warehouses', action: 'create' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWarehouseDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Patch(':id')
  @Permissions({ module: 'warehouses', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(id, user.organizationId, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'warehouses', action: 'delete' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.organizationId);
  }
}
