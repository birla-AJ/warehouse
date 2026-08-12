import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  MarkAttendanceDto,
  RequestLeaveDto,
  DecideLeaveDto,
} from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.employee.findMany({
      where: { deletedAt: null, user: { organizationId } },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, organizationId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null, user: { organizationId } },
      include: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(organizationId: string, dto: CreateEmployeeDto) {
    const targetUser = await this.prisma.user.findFirst({ where: { id: dto.userId, organizationId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const existing = await this.prisma.employee.findUnique({ where: { userId: dto.userId } });
    if (existing) throw new ConflictException('This user is already an employee record');

    const employeeCode = await this.generateEmployeeCode();

    return this.prisma.employee.create({
      data: {
        employeeCode,
        user: { connect: { id: dto.userId } },
        designation: dto.designation,
        shift: dto.shift,
        salary: dto.salary,
        joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined,
      },
      include: { user: true },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateEmployeeDto) {
    await this.getById(id, organizationId);
    const { userId, joinDate, ...rest } = dto;
    return this.prisma.employee.update({
      where: { id },
      data: { ...rest, joinDate: joinDate ? new Date(joinDate) : undefined },
      include: { user: true },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.getById(id, organizationId);
    await this.prisma.employee.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Employee deactivated' };
  }

  // ── Attendance ───────────────────────────────────────────

  async markAttendance(organizationId: string, dto: MarkAttendanceDto) {
    await this.getById(dto.employeeId, organizationId);
    const date = this.dateOnly(dto.date);

    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
      update: { status: dto.status, note: dto.note },
      create: { employeeId: dto.employeeId, date, status: dto.status, note: dto.note },
    });
  }

  async listAttendance(organizationId: string, employeeId?: string, from?: string, to?: string) {
    return this.prisma.attendance.findMany({
      where: {
        employee: { user: { organizationId } },
        ...(employeeId ? { employeeId } : {}),
        ...(from || to
          ? { date: { ...(from ? { gte: this.dateOnly(from) } : {}), ...(to ? { lte: this.dateOnly(to) } : {}) } }
          : {}),
      },
      orderBy: { date: 'desc' },
      include: { employee: { include: { user: true } } },
    });
  }

  // ── Leave ────────────────────────────────────────────────

  async requestLeave(organizationId: string, dto: RequestLeaveDto) {
    await this.getById(dto.employeeId, organizationId);
    const fromDate = new Date(dto.fromDate);
    const toDate = new Date(dto.toDate);
    if (toDate < fromDate) throw new BadRequestException('toDate cannot be before fromDate');

    return this.prisma.leaveRequest.create({
      data: { employeeId: dto.employeeId, fromDate, toDate, reason: dto.reason },
    });
  }

  async decideLeave(id: string, organizationId: string, dto: DecideLeaveDto, decidedById?: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, employee: { user: { organizationId } } },
    });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== 'PENDING') {
      throw new BadRequestException(`Leave request is already ${leave.status.toLowerCase()}`);
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: dto.status, decidedById, decidedAt: new Date() },
    });
  }

  listLeaves(organizationId: string, employeeId?: string, status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        employee: { user: { organizationId } },
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { employee: { include: { user: true } } },
    });
  }

  private dateOnly(iso: string): Date {
    const d = new Date(iso);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private async generateEmployeeCode(): Promise<string> {
    const count = await this.prisma.employee.count();
    return `EMP-${(count + 1).toString().padStart(5, '0')}`;
  }
}
