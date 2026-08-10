import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('audit-log')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private service: AuditLogService) {}

  @Get()
  @Permissions({ module: 'audit-log', action: 'read' })
  list(@Query() query: AuditLogQueryDto) {
    return this.service.list(query);
  }
}
