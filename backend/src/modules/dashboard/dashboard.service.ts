import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(organizationId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const farmerScope = { farmer: { organizationId } };

    const [
      todayRevenueAgg,
      monthlyRevenueAgg,
      todayEntries,
      todayDispatch,
      farmerCount,
      inventoryCount,
      cropDistributionRaw,
      openInvoices,
      occupancyRows,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { ...farmerScope, createdAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { ...farmerScope, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.bag.count({ where: { ...farmerScope, deletedAt: null, receivedAt: { gte: startOfDay } } }),
      this.prisma.dispatch.count({
        where: { farmer: { organizationId }, status: 'COMPLETED', updatedAt: { gte: startOfDay } },
      }),
      this.prisma.farmer.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.bag.count({ where: { ...farmerScope, deletedAt: null, status: 'IN_STORAGE' } }),
      this.prisma.bag.groupBy({
        by: ['cropId'],
        where: { ...farmerScope, deletedAt: null, status: 'IN_STORAGE' },
        _count: true,
      }),
      this.prisma.invoice.findMany({
        where: { farmer: { organizationId }, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
        include: { payments: true },
      }),
      this.prisma.rack.findMany({
        where: { chamber: { floor: { warehouse: { organizationId, deletedAt: null } } }, deletedAt: null },
        select: { status: true },
      }),
    ]);

    const crops = await this.prisma.crop.findMany({
      where: { id: { in: cropDistributionRaw.map((c) => c.cropId) } },
      select: { id: true, name: true },
    });
    const cropNameMap = new Map(crops.map((c) => [c.id, c.name]));

    const pendingBillsTotal = openInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(inv.totalAmount) - paid);
    }, 0);

    const totalRacks = occupancyRows.length;
    const occupiedRacks = occupancyRows.filter((p) => p.status === 'PARTIAL' || p.status === 'FULL').length;

    return {
      todayRevenue: Number(todayRevenueAgg._sum.amount ?? 0),
      monthlyRevenue: Number(monthlyRevenueAgg._sum.amount ?? 0),
      todayEntries,
      todayDispatch,
      farmerCount,
      inventoryCount,
      pendingBillsTotal,
      pendingBillsCount: openInvoices.length,
      cropDistribution: cropDistributionRaw.map((row) => ({
        cropId: row.cropId,
        cropName: cropNameMap.get(row.cropId) ?? 'Unknown',
        bagCount: row._count,
      })),
      warehouseOccupancy: {
        totalRacks,
        occupiedRacks,
        availableRacks: totalRacks - occupiedRacks,
        occupancyPercent: totalRacks === 0 ? 0 : Math.round((occupiedRacks / totalRacks) * 10000) / 100,
      },
    };
  }
}
