import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { WeighbridgeService } from './weighbridge.service';
import { CreateWeighbridgeEntryDto } from './dto/weighbridge.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('weighbridge')
@Controller('weighbridge')
export class WeighbridgeController {
  constructor(private service: WeighbridgeService) {}

  @Post('entries')
  @Permissions({ module: 'weighbridge', action: 'create' })
  create(@Body() dto: CreateWeighbridgeEntryDto) {
    return this.service.create(dto);
  }

  @Get('entries')
  @Permissions({ module: 'weighbridge', action: 'read' })
  list(@Query('vehicleNo') vehicleNo?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.list(vehicleNo, Number(page) || 1, Number(limit) || 20);
  }

  @Get('entries/:id/slip')
  @Permissions({ module: 'weighbridge', action: 'read' })
  getSlip(@Param('id') id: string) {
    return this.service.getSlip(id);
  }

  /** Real, downloadable PDF slip — append ?format=pdf on the frontend link, or hit this directly. */
  @Get('entries/:id/slip/pdf')
  @Permissions({ module: 'weighbridge', action: 'read' })
  async getSlipPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.getSlipPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="weighbridge-slip-${id}.pdf"`);
    res.send(buffer);
  }
}
