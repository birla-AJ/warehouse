import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QualityService } from './quality.service';
import { CreateQualityReportDto } from './dto/quality.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('quality')
@Controller()
export class QualityController {
  constructor(private service: QualityService) {}

  @Post('bags/:bagId/quality-reports')
  @Permissions({ module: 'quality', action: 'create' })
  create(
    @Param('bagId') bagId: string,
    @Body() dto: CreateQualityReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createForBag(bagId, dto, user.id);
  }

  @Get('quality-reports')
  @Permissions({ module: 'quality', action: 'read' })
  list(@Query('bagId') bagId?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.list(bagId, Number(page) || 1, Number(limit) || 20);
  }
}
