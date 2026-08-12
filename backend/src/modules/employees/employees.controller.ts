import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  MarkAttendanceDto,
  RequestLeaveDto,
  DecideLeaveDto,
} from './dto/employee.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('employees')
@Controller()
export class EmployeesController {
  constructor(private service: EmployeesService) {}

  @Get('employees')
  @Permissions({ module: 'employees', action: 'read' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user.organizationId);
  }

  @Get('employees/:id')
  @Permissions({ module: 'employees', action: 'read' })
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getById(id, user.organizationId);
  }

  @Post('employees')
  @Permissions({ module: 'employees', action: 'create' })
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(user.organizationId, dto);
  }

  @Patch('employees/:id')
  @Permissions({ module: 'employees', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(id, user.organizationId, dto);
  }

  @Delete('employees/:id')
  @Permissions({ module: 'employees', action: 'delete' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.organizationId);
  }

  @Post('employees/:id/attendance')
  @Permissions({ module: 'employees', action: 'update' })
  markAttendance(
    @Param('id') employeeId: string,
    @Body() dto: Omit<MarkAttendanceDto, 'employeeId'>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.markAttendance(user.organizationId, { ...dto, employeeId });
  }

  @Get('attendance')
  @Permissions({ module: 'employees', action: 'read' })
  listAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listAttendance(user.organizationId, employeeId, from, to);
  }

  @Post('leave-requests')
  @Permissions({ module: 'employees', action: 'create' })
  requestLeave(@Body() dto: RequestLeaveDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.requestLeave(user.organizationId, dto);
  }

  @Get('leave-requests')
  @Permissions({ module: 'employees', action: 'read' })
  listLeaves(@CurrentUser() user: AuthenticatedUser, @Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    return this.service.listLeaves(user.organizationId, employeeId, status);
  }

  @Patch('leave-requests/:id/decide')
  @Permissions({ module: 'employees', action: 'update' })
  decideLeave(@Param('id') id: string, @Body() dto: DecideLeaveDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.decideLeave(id, user.organizationId, dto, user.id);
  }
}
