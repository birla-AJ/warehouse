import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BagsService } from '../bags/bags.service';
import { AdjustBagDto, MoveBagDto } from '../bags/dto/bag.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { IsUUID } from 'class-validator';

class AdjustInventoryDto extends AdjustBagDto {
  @IsUUID()
  bagId: string;
}

class TransferInventoryDto extends MoveBagDto {
  @IsUUID()
  bagId: string;
}

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private bagsService: BagsService) {}

  @Get('summary')
  @Permissions({ module: 'inventory', action: 'read' })
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.bagsService.summary(user.organizationId);
  }

  @Get('movements')
  @Permissions({ module: 'inventory', action: 'read' })
  movements(
    @CurrentUser() user: AuthenticatedUser,
    @Query('bagId') bagId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bagsService.listMovements(user.organizationId, bagId, Number(page) || 1, Number(limit) || 20);
  }

  @Patch('adjust')
  @Permissions({ module: 'inventory', action: 'update' })
  adjust(@Body() dto: AdjustInventoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bagsService.adjust(dto.bagId, user.organizationId, dto, user.id);
  }

  @Patch('transfer')
  @Permissions({ module: 'inventory', action: 'update' })
  transfer(@Body() dto: TransferInventoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bagsService.move(dto.bagId, user.organizationId, dto, user.id);
  }
}
