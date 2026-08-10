import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesPermissionsService } from './roles-permissions.service';
import { CreateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('roles-permissions')
@Controller()
export class RolesPermissionsController {
  constructor(private service: RolesPermissionsService) {}

  @Get('roles')
  @Permissions({ module: 'settings', action: 'read' })
  listRoles() {
    return this.service.listRoles();
  }

  @Get('permissions')
  @Permissions({ module: 'settings', action: 'read' })
  listPermissions() {
    return this.service.listPermissions();
  }

  @Post('roles')
  @Permissions({ module: 'settings', action: 'create' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.service.createRole(dto);
  }

  @Patch('roles/:id/permissions')
  @Permissions({ module: 'settings', action: 'update' })
  updateRolePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.service.updateRolePermissions(id, dto);
  }

  @Delete('roles/:id')
  @Permissions({ module: 'settings', action: 'delete' })
  deleteRole(@Param('id') id: string) {
    return this.service.deleteRole(id);
  }
}
