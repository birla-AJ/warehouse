import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post('payments')
  @Permissions({ module: 'payments', action: 'create' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(user.organizationId, dto);
  }

  @Post('payments/:id/refund')
  @Permissions({ module: 'payments', action: 'create' })
  refund(@Param('id') id: string, @Body() dto: RefundPaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.refund(id, user.organizationId, dto);
  }

  @Get('payments')
  @Permissions({ module: 'payments', action: 'read' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('farmerId') farmerId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.list(user.organizationId, farmerId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('farmers/:id/outstanding')
  @Permissions({ module: 'payments', action: 'read' })
  outstanding(@Param('id') farmerId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.farmerOutstanding(farmerId, user.organizationId);
  }
}
