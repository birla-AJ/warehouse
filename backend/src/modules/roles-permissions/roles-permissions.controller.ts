import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesPermissionsService } from './roles-permissions.service';
import { CreateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('roles-permissions')
@Controller()
export class RolesPermissionsController {
  constructor(private service: RolesPermissionsService) {}

  @Get('roles')
  @Permissions({ module: 'settings', action: 'read' })
  listRoles(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listRoles(user.organizationId);
  }

  @Get('permissions')
  @Permissions({ module: 'settings', action: 'read' })
  listPermissions() {
    return this.service.listPermissions();
  }

  @Post('roles')
  @Permissions({ module: 'settings', action: 'create' })
  createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createRole(user.organizationId, dto);
  }

  @Patch('roles/:id/permissions')
  @Permissions({ module: 'settings', action: 'update' })
  updateRolePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.updateRolePermissions(id, user.organizationId, dto);
  }

  @Delete('roles/:id')
  @Permissions({ module: 'settings', action: 'delete' })
  deleteRole(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.deleteRole(id, user.organizationId);
  }
}
