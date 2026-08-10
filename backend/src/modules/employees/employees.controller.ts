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
  list() {
    return this.service.list();
  }

  @Get('employees/:id')
  @Permissions({ module: 'employees', action: 'read' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('employees')
  @Permissions({ module: 'employees', action: 'create' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  @Patch('employees/:id')
  @Permissions({ module: 'employees', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(id, dto);
  }

  @Delete('employees/:id')
  @Permissions({ module: 'employees', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('employees/:id/attendance')
  @Permissions({ module: 'employees', action: 'update' })
  markAttendance(@Param('id') employeeId: string, @Body() dto: Omit<MarkAttendanceDto, 'employeeId'>) {
    return this.service.markAttendance({ ...dto, employeeId });
  }

  @Get('attendance')
  @Permissions({ module: 'employees', action: 'read' })
  listAttendance(@Query('employeeId') employeeId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.listAttendance(employeeId, from, to);
  }

  @Post('leave-requests')
  @Permissions({ module: 'employees', action: 'create' })
  requestLeave(@Body() dto: RequestLeaveDto) {
    return this.service.requestLeave(dto);
  }

  @Get('leave-requests')
  @Permissions({ module: 'employees', action: 'read' })
  listLeaves(@Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    return this.service.listLeaves(employeeId, status);
  }

  @Patch('leave-requests/:id/decide')
  @Permissions({ module: 'employees', action: 'update' })
  decideLeave(@Param('id') id: string, @Body() dto: DecideLeaveDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.decideLeave(id, dto, user.id);
  }
}
