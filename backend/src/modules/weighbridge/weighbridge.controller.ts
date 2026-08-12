import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { WeighbridgeService } from './weighbridge.service';
import { CreateWeighbridgeEntryDto } from './dto/weighbridge.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('weighbridge')
@Controller('weighbridge')
export class WeighbridgeController {
  constructor(private service: WeighbridgeService) {}

  @Post('entries')
  @Permissions({ module: 'weighbridge', action: 'create' })
  create(@Body() dto: CreateWeighbridgeEntryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(user.organizationId, dto);
  }

  @Get('entries')
  @Permissions({ module: 'weighbridge', action: 'read' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('vehicleNo') vehicleNo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.list(user.organizationId, vehicleNo, Number(page) || 1, Number(limit) || 20);
  }

  @Get('entries/:id/slip')
  @Permissions({ module: 'weighbridge', action: 'read' })
  getSlip(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getSlip(id, user.organizationId);
  }

  /** Real, downloadable PDF slip — append ?format=pdf on the frontend link, or hit this directly. */
  @Get('entries/:id/slip/pdf')
  @Permissions({ module: 'weighbridge', action: 'read' })
  async getSlipPdf(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const buffer = await this.service.getSlipPdf(id, user.organizationId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="weighbridge-slip-${id}.pdf"`);
    res.send(buffer);
  }
}
