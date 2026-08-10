import { Test } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../../database/prisma.service';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      billingRule: { findMany: jest.fn(), create: jest.fn() },
      farmer: { findMany: jest.fn() },
      bag: { findMany: jest.fn() },
      invoice: { create: jest.fn(), count: jest.fn().mockResolvedValue(0), findMany: jest.fn(), findUnique: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [BillingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(BillingService);
  });

  it('skips farmers with no in-storage bags', async () => {
    prisma.billingRule.findMany.mockResolvedValue([]);
    prisma.farmer.findMany.mockResolvedValue([{ id: 'f1' }]);
    prisma.bag.findMany.mockResolvedValue([]);

    const result = await service.generate('org1', { periodFrom: '2026-07-01', periodTo: '2026-07-31' } as any);

    expect(result.generated).toBe(0);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('computes storage days and rate correctly for a single bag', async () => {
    prisma.billingRule.findMany.mockResolvedValue([
      { id: 'rule1', cropId: null, isDefault: true, ratePerBagPerDay: 2, ratePerKgPerDay: 0, handlingCharge: 10, loadingCharge: 0, unloadingCharge: 0, packingCharge: 0, cleaningCharge: 0, sortingCharge: 0, insuranceCharge: 0, gstPercent: 10 },
    ]);
    prisma.farmer.findMany.mockResolvedValue([{ id: 'f1' }]);
    prisma.bag.findMany.mockResolvedValue([
      {
        id: 'bag1',
        bagCode: 'BAG-1',
        cropId: 'crop1',
        weightKg: 50,
        receivedAt: new Date('2026-07-01T00:00:00Z'),
        crop: { name: 'Potato', defaultCharge: 0 },
      },
    ]);
    prisma.invoice.create.mockImplementation((args: any) => Promise.resolve({ id: 'inv1', ...args.data }));

    const result = await service.generate('org1', {
      periodFrom: '2026-07-01',
      periodTo: '2026-07-11',
    } as any);

    expect(result.generated).toBe(1);
    const invoiceData = prisma.invoice.create.mock.calls[0][0].data;
    // 10 days * rate 2/day = 20 subtotal (bag) + 10 handling = 30 pre-GST
    expect(invoiceData.subtotal).toBe(30);
    expect(invoiceData.gstAmount).toBe(3); // 10% of 30
    expect(invoiceData.totalAmount).toBe(33);
  });
});
