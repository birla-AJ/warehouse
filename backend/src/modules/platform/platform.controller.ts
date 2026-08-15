import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

/**
 * Everything here is cross-organization by design, so it never goes through
 * the org-scoped RbacGuard/@Permissions() path the rest of the API uses —
 * SuperAdminGuard is the single, deliberately narrow gate for all of it.
 */
@ApiTags('platform')
@UseGuards(SuperAdminGuard)
@Controller('platform')
export class PlatformController {
  constructor(private service: PlatformService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('overview/:resource')
  getOverviewDetails(@Param('resource') resource: string) {
    return this.service.getOverviewDetails(resource);
  }

  @Get('admins')
  listAdmins(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.service.listAdmins(Number(page) || 1, Number(limit) || 20, search);
  }

  @Get('admins/:id')
  getAdmin(@Param('id') id: string) {
    return this.service.getAdmin(id);
  }

  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.service.createAdmin(dto);
  }

  @Patch('admins/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAdminStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete('admins/:id')
  removeAdmin(@Param('id') id: string) {
    return this.service.removeAdmin(id);
  }
}
