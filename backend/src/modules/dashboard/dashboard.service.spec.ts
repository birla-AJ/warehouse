import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      payment: { aggregate: jest.fn() },
      bag: { count: jest.fn(), groupBy: jest.fn() },
      dispatch: { count: jest.fn() },
      farmer: { count: jest.fn() },
      invoice: { findMany: jest.fn() },
      rack: { findMany: jest.fn() },
      crop: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  it('aggregates KPIs from independent queries into one summary', async () => {
    prisma.payment.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 500 } }) // today
      .mockResolvedValueOnce({ _sum: { amount: 5000 } }); // month
    prisma.bag.count.mockResolvedValueOnce(3).mockResolvedValueOnce(20); // todayEntries, inventoryCount
    prisma.dispatch.count.mockResolvedValue(2);
    prisma.farmer.count.mockResolvedValue(15);
    prisma.bag.groupBy.mockResolvedValue([{ cropId: 'c1', _count: 5 }]);
    prisma.invoice.findMany.mockResolvedValue([
      { totalAmount: 300, payments: [{ amount: 100 }] },
    ]);
    prisma.rack.findMany.mockResolvedValue([{ status: 'FULL' }, { status: 'EMPTY' }, { status: 'PARTIAL' }]);
    prisma.crop.findMany.mockResolvedValue([{ id: 'c1', name: 'Potato' }]);

    const result = await service.getSummary('org1');

    expect(result.todayRevenue).toBe(500);
    expect(result.monthlyRevenue).toBe(5000);
    expect(result.todayEntries).toBe(3);
    expect(result.inventoryCount).toBe(20);
    expect(result.farmerCount).toBe(15);
    expect(result.pendingBillsTotal).toBe(200);
    expect(result.cropDistribution).toEqual([{ cropId: 'c1', cropName: 'Potato', bagCount: 5 }]);
    expect(result.warehouseOccupancy).toEqual({
      totalRacks: 3,
      occupiedRacks: 2,
      availableRacks: 1,
      occupancyPercent: 66.67,
    });
  });

  it('handles zero payments and zero racks without dividing by zero', async () => {
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.bag.count.mockResolvedValue(0);
    prisma.dispatch.count.mockResolvedValue(0);
    prisma.farmer.count.mockResolvedValue(0);
    prisma.bag.groupBy.mockResolvedValue([]);
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.rack.findMany.mockResolvedValue([]);
    prisma.crop.findMany.mockResolvedValue([]);

    const result = await service.getSummary('org1');
    expect(result.todayRevenue).toBe(0);
    expect(result.warehouseOccupancy.occupancyPercent).toBe(0);
  });
});
