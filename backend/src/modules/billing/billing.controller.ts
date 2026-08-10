import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { CreateBillingRuleDto, GenerateInvoicesDto } from './dto/billing.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('billing')
@Controller()
export class BillingController {
  constructor(private service: BillingService) {}

  @Post('billing/rules')
  @Permissions({ module: 'billing', action: 'create' })
  createRule(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBillingRuleDto) {
    return this.service.createRule(user.organizationId, dto);
  }

  @Get('billing/rules')
  @Permissions({ module: 'billing', action: 'read' })
  listRules(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listRules(user.organizationId);
  }

  @Post('billing/generate')
  @Permissions({ module: 'billing', action: 'create' })
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateInvoicesDto) {
    return this.service.generate(user.organizationId, dto);
  }

  @Get('invoices')
  @Permissions({ module: 'billing', action: 'read' })
  list(
    @Query('farmerId') farmerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.list(farmerId, status, Number(page) || 1, Number(limit) || 20);
  }

  @Get('invoices/:id')
  @Permissions({ module: 'billing', action: 'read' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get('invoices/:id/pdf')
  @Permissions({ module: 'billing', action: 'read' })
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.getInvoicePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`);
    res.send(buffer);
  }
}
