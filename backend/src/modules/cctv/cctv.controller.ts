import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CctvService } from './cctv.service';
import { CreateCameraDto, UpdateCameraDto, UpdateCameraHealthDto, MotionAlertDto } from './dto/camera.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { WebhookSignatureGuard } from '../../common/guards/webhook-signature.guard';

@ApiTags('cctv')
@Controller('cameras')
export class CctvController {
  constructor(private service: CctvService) {}

  @Get()
  @Permissions({ module: 'cctv', action: 'read' })
  list(@Query('warehouseId') warehouseId?: string) {
    return this.service.list(warehouseId);
  }

  @Get(':id')
  @Permissions({ module: 'cctv', action: 'read' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get(':id/stream')
  @Permissions({ module: 'cctv', action: 'read' })
  getStream(@Param('id') id: string) {
    return this.service.getStreamInfo(id);
  }

  @Get(':id/health')
  @Permissions({ module: 'cctv', action: 'read' })
  getHealth(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @Permissions({ module: 'cctv', action: 'create' })
  create(@Body() dto: CreateCameraDto) {
    return this.service.create(dto);
  }

  @Post(':id/snapshot')
  @Permissions({ module: 'cctv', action: 'read' })
  snapshot(@Param('id') id: string) {
    return this.service.requestSnapshot(id);
  }

  @Patch(':id')
  @Permissions({ module: 'cctv', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateCameraDto) {
    return this.service.update(id, dto);
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
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
