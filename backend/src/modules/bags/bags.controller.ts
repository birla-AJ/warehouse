import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BagsService } from './bags.service';
import { CreateBagDto, MoveBagDto, AdjustBagDto, DamageBagDto, ListBagsQueryDto } from './dto/bag.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('bags')
@Controller()
export class BagsController {
  constructor(private service: BagsService) {}

  @Get('bags')
  @Permissions({ module: 'inventory', action: 'read' })
  list(@Query() query: ListBagsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user.organizationId, query);
  }

  @Get('bags/:id')
  @Permissions({ module: 'inventory', action: 'read' })
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getById(id, user.organizationId);
  }

  @Post('bags')
  @Permissions({ module: 'inventory', action: 'create' })
  create(@Body() dto: CreateBagDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Patch('bags/:id/move')
  @Permissions({ module: 'inventory', action: 'update' })
  move(@Param('id') id: string, @Body() dto: MoveBagDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.move(id, user.organizationId, dto, user.id);
  }

  @Patch('bags/:id/adjust')
  @Permissions({ module: 'inventory', action: 'update' })
  adjust(@Param('id') id: string, @Body() dto: AdjustBagDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.adjust(id, user.organizationId, dto, user.id);
  }

  @Patch('bags/:id/damage')
  @Permissions({ module: 'inventory', action: 'update' })
  markDamaged(@Param('id') id: string, @Body() dto: DamageBagDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.markDamaged(id, user.organizationId, dto, user.id);
  }

  @Get('qr/:code/resolve')
  @Permissions({ module: 'inventory', action: 'read' })
  resolveQr(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getByQrCode(code, user.organizationId);
  }
}
