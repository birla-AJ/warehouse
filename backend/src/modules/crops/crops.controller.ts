import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CropsService } from './crops.service';
import { CreateCropDto, UpdateCropDto, CreateBagTypeDto, AssignBagTypesDto } from './dto/crop.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('crops')
@Controller()
export class CropsController {
  constructor(private service: CropsService) {}

  @Get('crops')
  @Permissions({ module: 'settings', action: 'read' })
  list() {
    return this.service.list();
  }

  @Get('crops/:id')
  @Permissions({ module: 'settings', action: 'read' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('crops')
  @Permissions({ module: 'settings', action: 'create' })
  create(@Body() dto: CreateCropDto) {
    return this.service.create(dto);
  }

  @Patch('crops/:id')
  @Permissions({ module: 'settings', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateCropDto) {
    return this.service.update(id, dto);
  }

  @Patch('crops/:id/bag-types')
  @Permissions({ module: 'settings', action: 'update' })
  assignBagTypes(@Param('id') id: string, @Body() dto: AssignBagTypesDto) {
    return this.service.assignBagTypes(id, dto);
  }

  @Delete('crops/:id')
  @Permissions({ module: 'settings', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('bag-types')
  @Permissions({ module: 'settings', action: 'read' })
  listBagTypes() {
    return this.service.listBagTypes();
  }

  @Post('bag-types')
  @Permissions({ module: 'settings', action: 'create' })
  createBagType(@Body() dto: CreateBagTypeDto) {
    return this.service.createBagType(dto);
  }
}
