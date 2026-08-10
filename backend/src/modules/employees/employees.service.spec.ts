import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../../database/prisma.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      employee: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(0), findMany: jest.fn() },
      attendance: { upsert: jest.fn(), findMany: jest.fn() },
      leaveRequest: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [EmployeesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(EmployeesService);
  });

  it('throws ConflictException when the user already has an employee record', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.create({ userId: 'u1' } as any)).rejects.toThrow(ConflictException);
  });

  it('generates a sequential EMP- code', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    prisma.employee.count.mockResolvedValue(2);
    prisma.employee.create.mockImplementation((args: any) => Promise.resolve({ id: 'e1', ...args.data }));

    const result = await service.create({ userId: 'u1', designation: 'Supervisor' } as any);
    expect(result.employeeCode).toBe('EMP-00003');
  });

  it('throws NotFoundException for an unknown employee', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('marks attendance idempotently via upsert on (employeeId, date)', async () => {
    prisma.employee.findFirst.mockResolvedValue({ id: 'e1' });
    prisma.attendance.upsert.mockResolvedValue({ id: 'a1', status: 'PRESENT' });

    await service.markAttendance({ employeeId: 'e1', date: '2026-07-24', status: 'PRESENT' } as any);

    expect(prisma.attendance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { employeeId_date: { employeeId: 'e1', date: expect.any(Date) } },
      }),
    );
  });

  it('rejects a leave request where toDate is before fromDate', async () => {
    prisma.employee.findFirst.mockResolvedValue({ id: 'e1' });
    await expect(
      service.requestLeave({ employeeId: 'e1', fromDate: '2026-07-10', toDate: '2026-07-05' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects deciding an already-decided leave request', async () => {
    prisma.leaveRequest.findUnique.mockResolvedValue({ id: 'l1', status: 'APPROVED' });
    await expect(service.decideLeave('l1', { status: 'REJECTED' } as any)).rejects.toThrow(BadRequestException);
  });

  it('approves a pending leave request', async () => {
    prisma.leaveRequest.findUnique.mockResolvedValue({ id: 'l1', status: 'PENDING' });
    prisma.leaveRequest.update.mockResolvedValue({ id: 'l1', status: 'APPROVED' });

    const result = await service.decideLeave('l1', { status: 'APPROVED' } as any, 'manager1');
    expect(result.status).toBe('APPROVED');
    expect(prisma.leaveRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED', decidedById: 'manager1' }) }),
    );
  });
});
