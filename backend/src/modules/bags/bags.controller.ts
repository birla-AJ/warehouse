import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BagsService } from './bags.service';
import {
  CreateBagDto,
  AdjustBagDto,
  ListBagsQueryDto,
  ListBatchesQueryDto,
  MoveBatchDto,
  DamageBatchDto,
} from './dto/bag.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('bags')
@Controller()
export class BagsController {
  constructor(private service: BagsService) {}

  // ── batches (primary inventory view) ────────────────────────

  @Get('batches')
  @Permissions({ module: 'inventory', action: 'read' })
  listBatches(@Query() query: ListBatchesQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listBatches(user.organizationId, query);
  }

  @Patch('batches/:batchId/move')
  @Permissions({ module: 'inventory', action: 'update' })
  moveBatch(@Param('batchId') batchId: string, @Body() dto: MoveBatchDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.moveBatch(user.organizationId, batchId, dto, user.id);
  }

  @Patch('batches/:batchId/damage')
  @Permissions({ module: 'inventory', action: 'update' })
  damageBatch(@Param('batchId') batchId: string, @Body() dto: DamageBatchDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.damageBatch(user.organizationId, batchId, dto, user.id);
  }

  // ── individual bags (kept for QR lookups / internal audit trail) ───

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
    return this.service.create(user.organizationId, dto, user.id);
  }

  @Patch('bags/:id/adjust')
  @Permissions({ module: 'inventory', action: 'update' })
  adjust(@Param('id') id: string, @Body() dto: AdjustBagDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.adjust(id, user.organizationId, dto, user.id);
  }

  @Get('qr/:code/resolve')
  @Permissions({ module: 'inventory', action: 'read' })
  resolveQr(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getByQrCode(code, user.organizationId);
  }
}
