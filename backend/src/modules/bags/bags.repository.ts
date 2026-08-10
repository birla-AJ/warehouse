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

  findById(id: string, client: Client = this.prisma) {
    return client.bag.findFirst({
      where: { id, deletedAt: null },
      include: { farmer: true, crop: true, bagType: true, position: true },
    });
  }

  findByQrCode(qrCode: string) {
    return this.prisma.bag.findUnique({
      where: { qrCode },
      include: { farmer: true, crop: true, bagType: true, position: true, movements: { orderBy: { createdAt: 'desc' } } },
    });
  }

  countAll() {
    return this.prisma.bag.count();
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

  groupByStatus() {
    return this.prisma.bag.groupBy({ by: ['status'], where: { deletedAt: null }, _count: true });
  }

  groupByCrop() {
    return this.prisma.bag.groupBy({
      by: ['cropId'],
      where: { deletedAt: null, status: 'IN_STORAGE' },
      _count: true,
      _sum: { weightKg: true },
    });
  }

  /** Exposes $transaction so the service layer can wrap multi-step operations atomically. */
  runInTransaction<T>(fn: (tx: Client) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
