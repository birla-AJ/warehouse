import { Test } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { auditLog: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) } };

    const moduleRef = await Test.createTestingModule({
      providers: [AuditLogService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AuditLogService);
  });

  it('builds a where clause from module/userId/entityId/date filters', async () => {
    await service.list({
      userId: 'u1',
      module: 'farmers',
      entityId: 'f1',
      from: '2026-07-01',
      to: '2026-07-31',
    } as any);

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'u1',
          module: 'farmers',
          entityId: 'f1',
          createdAt: { gte: new Date('2026-07-01'), lte: new Date('2026-07-31') },
        },
      }),
    );
  });

  it('caps limit at 200 even if a larger value is requested', async () => {
    await service.list({ limit: 9999 } as any);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 200 }));
  });
});
