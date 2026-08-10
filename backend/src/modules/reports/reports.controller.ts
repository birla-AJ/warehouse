import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CsvUtil } from '../../common/utils/csv.util';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('inventory')
  @Permissions({ module: 'reports', action: 'read' })
  async inventory(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto, @Res() res: Response) {
    const rows = await this.service.inventory(user.organizationId);
    await this.respond(res, rows, query.format, 'inventory-report');
  }

  @Get('farmers')
  @Permissions({ module: 'reports', action: 'read' })
  async farmers(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto, @Res() res: Response) {
    const rows = await this.service.farmers(user.organizationId);
    await this.respond(res, rows, query.format, 'farmer-report');
  }

  @Get('crops')
  @Permissions({ module: 'reports', action: 'read' })
  async crops(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto, @Res() res: Response) {
    const rows = await this.service.crops(user.organizationId);
    await this.respond(res, rows, query.format, 'crop-report');
  }

  @Get('warehouses')
  @Permissions({ module: 'reports', action: 'read' })
  async warehouses(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto, @Res() res: Response) {
    const rows = await this.service.warehouses(user.organizationId);
    await this.respond(res, rows, query.format, 'warehouse-occupancy-report');
  }

  @Get('revenue')
  @Permissions({ module: 'reports', action: 'read' })
  async revenue(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto, @Res() res: Response) {
    const rows = await this.service.revenue(user.organizationId, query.from, query.to);
    await this.respond(res, rows, query.format, 'revenue-report');
  }

  @Get('pending-bills')
  @Permissions({ module: 'reports', action: 'read' })
  async pendingBills(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto, @Res() res: Response) {
    const rows = await this.service.pendingBills(user.organizationId);
    await this.respond(res, rows, query.format, 'pending-bills-report');
  }

  @Get('damage')
  @Permissions({ module: 'reports', action: 'read' })
  async damage(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto, @Res() res: Response) {
    const rows = await this.service.damage(user.organizationId);
    await this.respond(res, rows, query.format, 'damage-report');
  }

  @Get('dispatch')
  @Permissions({ module: 'reports', action: 'read' })
  async dispatch(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto, @Res() res: Response) {
    const rows = await this.service.dispatch(user.organizationId, query.from, query.to);
    await this.respond(res, rows, query.format, 'dispatch-report');
  }

  /** format=csv streams CSV, format=xlsx streams a native Excel workbook, otherwise JSON. */
  private async respond(
    res: Response,
    rows: Record<string, any>[],
    format: string | undefined,
    filenameBase: string,
  ) {
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      res.send(CsvUtil.toCsv(rows));
      return;
    }

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AWMS';
      workbook.created = new Date();
      const sheet = workbook.addWorksheet(filenameBase.slice(0, 31)); // Excel sheet name limit

      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        sheet.columns = headers.map((h) => ({ header: h, key: h, width: Math.max(14, h.length + 2) }));
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        rows.forEach((row) => {
          const flat: Record<string, any> = {};
          for (const h of headers) {
            const v = row[h];
            flat[h] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
          }
          sheet.addRow(flat);
        });
      } else {
        sheet.addRow(['No data for the selected filters']);
      }

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    res.json({ rows, count: rows.length });
  }
}
