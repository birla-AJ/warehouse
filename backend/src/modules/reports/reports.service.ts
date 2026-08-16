import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async inventory(organizationId: string) {
    const bags = await this.prisma.bag.findMany({
      where: { farmer: { organizationId }, deletedAt: null, status: 'IN_STORAGE' },
      include: { farmer: true, crop: true, rack: true },
      orderBy: { receivedAt: 'desc' },
    });

    return bags.map((b) => ({
      bagCode: b.bagCode,
      farmerName: b.farmer.name,
      farmerCode: b.farmer.farmerCode,
      cropName: b.crop.name,
      grade: b.grade,
      weightKg: Number(b.weightKg),
      locationCode: b.rack?.locationCode ?? 'Unassigned',
      receivedAt: b.receivedAt.toISOString(),
    }));
  }

  async farmers(organizationId: string) {
    const farmers = await this.prisma.farmer.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        bags: { where: { deletedAt: null, status: 'IN_STORAGE' } },
        invoices: { include: { payments: true } },
      },
    });

    return farmers.map((f) => {
      const bagCount = f.bags.length;
      const totalWeightKg = f.bags.reduce((sum, b) => sum + Number(b.weightKg), 0);
      const outstanding = f.invoices
        .filter((inv) => inv.status !== 'PAID')
        .reduce((sum, inv) => {
          const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
          return sum + (Number(inv.totalAmount) - paid);
        }, 0);

      return {
        farmerCode: f.farmerCode,
        name: f.name,
        village: f.village,
        mobile: f.mobile,
        bagsInStorage: bagCount,
        totalWeightKg,
        outstandingAmount: outstanding,
      };
    });
  }

  async crops(organizationId: string) {
    const rows = await this.prisma.bag.groupBy({
      by: ['cropId'],
      where: { farmer: { organizationId }, deletedAt: null, status: 'IN_STORAGE' },
      _count: true,
      _sum: { weightKg: true },
    });
    const crops = await this.prisma.crop.findMany({ where: { id: { in: rows.map((r) => r.cropId) } } });
    const nameMap = new Map(crops.map((c) => [c.id, c.name]));

    return rows.map((r) => ({
      cropName: nameMap.get(r.cropId) ?? 'Unknown',
      bagCount: r._count,
      totalWeightKg: Number(r._sum.weightKg ?? 0),
    }));
  }

  async warehouses(organizationId: string) {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        floors: {
          include: { chambers: { include: { racks: true } } },
        },
      },
    });

    return warehouses.map((wh) => {
      const racks = wh.floors.flatMap((f) => f.chambers.flatMap((c) => c.racks));
      const total = racks.length;
      const occupied = racks.filter((r) => r.status === 'PARTIAL' || r.status === 'FULL').length;

      return {
        warehouseCode: wh.code,
        warehouseName: wh.name,
        totalRacks: total,
        occupiedRacks: occupied,
        occupancyPercent: total === 0 ? 0 : Math.round((occupied / total) * 10000) / 100,
      };
    });
  }

  async revenue(organizationId: string, from?: string, to?: string) {
    const where = {
      farmer: { organizationId },
      ...(from || to
        ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    };
    const payments = await this.prisma.payment.findMany({ where, include: { farmer: true } });

    return payments.map((p) => ({
      receiptNo: p.receiptNo,
      farmerName: p.farmer.name,
      amount: Number(p.amount),
      method: p.method,
      date: p.createdAt.toISOString(),
    }));
  }

  async pendingBills(organizationId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { farmer: { organizationId }, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      include: { farmer: true, payments: true },
    });

    return invoices.map((inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return {
        invoiceNumber: inv.invoiceNumber,
        farmerName: inv.farmer.name,
        totalAmount: Number(inv.totalAmount),
        paid,
        outstanding: Number(inv.totalAmount) - paid,
        status: inv.status,
      };
    });
  }

  async damage(organizationId: string) {
    const bags = await this.prisma.bag.findMany({
      where: { farmer: { organizationId }, status: 'DAMAGED' },
      include: { farmer: true, crop: true, movements: { where: { type: 'DAMAGE' }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    return bags.map((b) => ({
      bagCode: b.bagCode,
      farmerName: b.farmer.name,
      cropName: b.crop.name,
      weightKg: Number(b.weightKg),
      reportedAt: b.movements[0]?.createdAt.toISOString() ?? null,
      note: b.movements[0]?.note ?? null,
    }));
  }

  async dispatch(organizationId: string, from?: string, to?: string) {
    const where = {
      farmer: { organizationId },
      status: 'COMPLETED' as const,
      ...(from || to
        ? { updatedAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    };
    const dispatches = await this.prisma.dispatch.findMany({
      where,
      include: { farmer: true, bags: true },
    });

    return dispatches.map((d) => ({
      dispatchNumber: d.dispatchNumber,
      farmerName: d.farmer.name,
      vehicleNo: d.vehicleNo,
      driverName: d.driverName,
      bagCount: d.bags.length,
      dispatchedAt: d.updatedAt.toISOString(),
    }));
  }
}
