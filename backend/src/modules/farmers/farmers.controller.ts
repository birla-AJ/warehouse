import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FarmersService } from './farmers.service';
import { CreateFarmerDto, UpdateFarmerDto, ListFarmersQueryDto } from './dto/farmer.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('farmers')
@Controller('farmers')
export class FarmersController {
  constructor(private service: FarmersService) {}

  @Get()
  @Permissions({ module: 'farmers', action: 'read' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListFarmersQueryDto) {
    return this.service.list(user.organizationId, query);
  }

  @Get(':id')
  @Permissions({ module: 'farmers', action: 'read' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @Permissions({ module: 'farmers', action: 'create' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFarmerDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Patch(':id')
  @Permissions({ module: 'farmers', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateFarmerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'farmers', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
