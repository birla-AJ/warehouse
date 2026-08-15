import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/** Accepts either the app-wide PrismaService or a `$transaction` callback's scoped client. */
type Client = Prisma.TransactionClient;

@Injectable()
export class BagsRepository {
  constructor(private prisma: PrismaService) {}

  findMany(where: Prisma.BagWhereInput, skip: number, take: number) {
    return this.prisma.bag.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { farmer: true, crop: true, bagType: true, position: true },
    });
  }

  count(where: Prisma.BagWhereInput) {
    return this.prisma.bag.count({ where });
  }

  findById(id: string, organizationId: string, client: Client = this.prisma) {
    return client.bag.findFirst({
      where: { id, deletedAt: null, farmer: { organizationId } },
      include: { farmer: true, crop: true, bagType: true, position: true },
    });
  }

  findByQrCode(qrCode: string, organizationId: string) {
    return this.prisma.bag.findFirst({
      where: { qrCode, farmer: { organizationId } },
      include: { farmer: true, crop: true, bagType: true, position: true, movements: { orderBy: { createdAt: 'desc' } } },
    });
  }

  countAll() {
    return this.prisma.bag.count();
  }

  upsertStandardBagType(weightKg: number) {
    return this.prisma.bagType.upsert({
      where: { label: `${weightKg} KG` },
      update: { weightKg, deletedAt: null },
      create: { label: `${weightKg} KG`, weightKg },
    });
  }

  create(data: Prisma.BagCreateInput, client: Client = this.prisma) {
    return client.bag.create({ data, include: { farmer: true, crop: true, bagType: true, position: true } });
  }

  update(id: string, data: Prisma.BagUpdateInput, client: Client = this.prisma) {
    return client.bag.update({ where: { id }, data, include: { position: true } });
  }

  findPosition(id: string, client: Client = this.prisma) {
    return client.position.findFirst({ where: { id, deletedAt: null } });
  }

  findPositionByCode(locationCode: string, client: Client = this.prisma) {
    return client.position.findFirst({ where: { locationCode, deletedAt: null } });
  }

  createMovement(data: Prisma.InventoryMovementCreateInput, client: Client = this.prisma) {
    return client.inventoryMovement.create({ data });
  }

  findMovements(where: Prisma.InventoryMovementWhereInput, skip: number, take: number) {
    return this.prisma.inventoryMovement.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { bag: true },
    });
  }

  countMovements(where: Prisma.InventoryMovementWhereInput) {
    return this.prisma.inventoryMovement.count({ where });
  }

  groupByStatus(organizationId: string) {
    return this.prisma.bag.groupBy({
      by: ['status'],
      where: { deletedAt: null, farmer: { organizationId } },
      _count: true,
    });
  }

  groupByCrop(organizationId: string) {
    return this.prisma.bag.groupBy({
      by: ['cropId'],
      where: { deletedAt: null, status: 'IN_STORAGE', farmer: { organizationId } },
      _count: true,
      _sum: { weightKg: true },
    });
  }

  // ── batch helpers ─────────────────────────────────────────

  /** Distinct batchIds already used with this prefix — lets us pick the next sequence number. */
  findBatchIdsByPrefix(prefix: string) {
    return this.prisma.bag.findMany({
      where: { batchId: { startsWith: prefix } },
      distinct: ['batchId'],
      select: { batchId: true },
    });
  }

  /** One representative bag per batch (farmer/crop/grade/receivedAt), newest first, paginated. */
  findBatchSummaries(
    organizationId: string,
    opts: { farmerId?: string; cropId?: string; skip: number; take: number },
  ) {
    return this.prisma.bag.findMany({
      where: {
        deletedAt: null,
        farmer: { organizationId },
        ...(opts.farmerId ? { farmerId: opts.farmerId } : {}),
        ...(opts.cropId ? { cropId: opts.cropId } : {}),
      },
      distinct: ['batchId'],
      orderBy: { receivedAt: 'desc' },
      skip: opts.skip,
      take: opts.take,
      include: { farmer: true, crop: true },
    });
  }

  async countBatches(organizationId: string, opts: { farmerId?: string; cropId?: string }) {
    const rows = await this.prisma.bag.groupBy({
      by: ['batchId'],
      where: {
        deletedAt: null,
        farmer: { organizationId },
        ...(opts.farmerId ? { farmerId: opts.farmerId } : {}),
        ...(opts.cropId ? { cropId: opts.cropId } : {}),
      },
    });
    return rows.length;
  }

  /** Per-batch, per-status bag counts + weight sums — used to compute batch totals/status. */
  groupBatchStatus(organizationId: string, batchIds: string[]) {
    return this.prisma.bag.groupBy({
      by: ['batchId', 'status'],
      where: { batchId: { in: batchIds }, deletedAt: null, farmer: { organizationId } },
      _count: true,
      _sum: { weightKg: true },
    });
  }

  /** One IN_STORAGE bag per batch, with its position — batches are always placed as a whole. */
  findBatchPositions(organizationId: string, batchIds: string[]) {
    return this.prisma.bag.findMany({
      where: { batchId: { in: batchIds }, status: 'IN_STORAGE', deletedAt: null, farmer: { organizationId } },
      distinct: ['batchId'],
      include: { position: true },
    });
  }

  /** IN_STORAGE bags for a batch, oldest first — the pool damage/dispatch/move actions draw from. */
  findBatchBagsInStorage(organizationId: string, batchId: string, take?: number) {
    return this.prisma.bag.findMany({
      where: { batchId, status: 'IN_STORAGE', deletedAt: null, farmer: { organizationId } },
      orderBy: { bagCode: 'asc' },
      take,
    });
  }

  /** Farmer's org-scoped farmerCode and the crop's name — used to build a batch code. */
  async findFarmerAndCropCodes(organizationId: string, farmerId: string, cropId: string) {
    const [farmer, crop] = await Promise.all([
      this.prisma.farmer.findFirst({ where: { id: farmerId, organizationId }, select: { farmerCode: true } }),
      this.prisma.crop.findFirst({ where: { id: cropId }, select: { name: true } }),
    ]);
    return { farmerCode: farmer?.farmerCode, cropName: crop?.name };
  }

  /** Exposes $transaction so the service layer can wrap multi-step operations atomically. */
  runInTransaction<T>(fn: (tx: Client) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
