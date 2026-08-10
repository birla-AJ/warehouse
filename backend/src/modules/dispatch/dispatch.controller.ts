import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DispatchService } from './dispatch.service';
import { CreateDispatchDto, VerifyDispatchOtpDto } from './dto/dispatch.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('dispatch')
@Controller('dispatch')
export class DispatchController {
  constructor(private service: DispatchService) {}

  @Get()
  @Permissions({ module: 'dispatch', action: 'read' })
  list(@Query('farmerId') farmerId?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.list(farmerId, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @Permissions({ module: 'dispatch', action: 'read' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @Permissions({ module: 'dispatch', action: 'create' })
  create(@Body() dto: CreateDispatchDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Post(':id/verify-otp')
  @Permissions({ module: 'dispatch', action: 'update' })
  verifyOtp(@Param('id') id: string, @Body() dto: VerifyDispatchOtpDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.verifyOtp(id, dto, user.id);
  }

  @Post(':id/cancel')
  @Permissions({ module: 'dispatch', action: 'update' })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Get(':id/gate-pass')
  @Permissions({ module: 'dispatch', action: 'read' })
  getGatePass(@Param('id') id: string) {
    return this.service.getGatePass(id);
  }

  @Get(':id/gate-pass/pdf')
  @Permissions({ module: 'dispatch', action: 'read' })
  async getGatePassPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.getGatePassPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="gate-pass-${id}.pdf"`);
    res.send(buffer);
  }
}
