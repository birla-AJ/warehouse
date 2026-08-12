import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CctvService } from './cctv.service';
import { CreateCameraDto, UpdateCameraDto, UpdateCameraHealthDto, MotionAlertDto } from './dto/camera.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { WebhookSignatureGuard } from '../../common/guards/webhook-signature.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('cctv')
@Controller('cameras')
export class CctvController {
  constructor(private service: CctvService) {}

  @Get()
  @Permissions({ module: 'cctv', action: 'read' })
  list(@CurrentUser() user: AuthenticatedUser, @Query('warehouseId') warehouseId?: string) {
    return this.service.list(user.organizationId, warehouseId);
  }

  @Get(':id')
  @Permissions({ module: 'cctv', action: 'read' })
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getById(id, user.organizationId);
  }

  @Get(':id/stream')
  @Permissions({ module: 'cctv', action: 'read' })
  getStream(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getStreamInfo(id, user.organizationId);
  }

  @Get(':id/health')
  @Permissions({ module: 'cctv', action: 'read' })
  getHealth(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getById(id, user.organizationId);
  }

  @Post()
  @Permissions({ module: 'cctv', action: 'create' })
  create(@Body() dto: CreateCameraDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(user.organizationId, dto);
  }

  @Post(':id/snapshot')
  @Permissions({ module: 'cctv', action: 'read' })
  snapshot(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.requestSnapshot(id, user.organizationId);
  }

  @Patch(':id')
  @Permissions({ module: 'cctv', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateCameraDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(id, user.organizationId, dto);
  }

  // Health/motion webhooks are hit by the camera/NVR or an internal health-check
  // worker, not by a logged-in dashboard user — @Public() bypasses the JWT guard,
  // but WebhookSignatureGuard now requires a valid HMAC signature (see guard
  // docblock for the header contract) instead of accepting unsigned traffic.
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Patch(':id/health')
  reportHealth(@Param('id') id: string, @Body() dto: UpdateCameraHealthDto) {
    return this.service.reportHealth(id, dto);
  }

  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post(':id/motion-alert')
  motionAlert(@Param('id') id: string, @Body() dto: MotionAlertDto) {
    return this.service.motionAlert(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'cctv', action: 'delete' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.organizationId);
  }
}
