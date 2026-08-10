import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WarehousesRepository {
  constructor(private prisma: PrismaService) {}

  // ── Warehouse ──────────────────────────────────────────
  findMany(where: Prisma.WarehouseWhereInput, skip: number, take: number) {
    return this.prisma.warehouse.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  count(where: Prisma.WarehouseWhereInput) {
    return this.prisma.warehouse.count({ where });
  }

  findById(id: string) {
    return this.prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
  }

  findByCode(code: string) {
    return this.prisma.warehouse.findUnique({ where: { code } });
  }

  createWarehouse(data: Prisma.WarehouseCreateInput) {
    return this.prisma.warehouse.create({ data });
  }

  updateWarehouse(id: string, data: Prisma.WarehouseUpdateInput) {
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  softDeleteWarehouse(id: string) {
    return this.prisma.warehouse.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Full nested layout for visualization ────────────────
  getLayout(warehouseId: string) {
    return this.prisma.warehouse.findFirst({
      where: { id: warehouseId, deletedAt: null },
      include: {
        zones: {
          where: { deletedAt: null },
          orderBy: { code: 'asc' },
          include: {
            blocks: {
              where: { deletedAt: null },
              orderBy: { code: 'asc' },
              include: {
                rows: {
                  where: { deletedAt: null },
                  orderBy: { code: 'asc' },
                  include: {
                    racks: {
                      where: { deletedAt: null },
                      orderBy: { code: 'asc' },
                      include: {
                        levels: {
                          where: { deletedAt: null },
                          orderBy: { code: 'asc' },
                          include: {
                            positions: { where: { deletedAt: null }, orderBy: { code: 'asc' } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ── Zone / Block / Row / Rack / Level / Position ────────
  findZone(id: string) {
    return this.prisma.zone.findFirst({ where: { id, deletedAt: null }, include: { warehouse: true } });
  }
  createZone(data: Prisma.ZoneCreateInput) {
    return this.prisma.zone.create({ data });
  }

  findBlock(id: string) {
    return this.prisma.block.findFirst({
      where: { id, deletedAt: null },
      include: { zone: { include: { warehouse: true } } },
    });
  }
  createBlock(data: Prisma.BlockCreateInput) {
    return this.prisma.block.create({ data });
  }

  findRow(id: string) {
    return this.prisma.row.findFirst({
      where: { id, deletedAt: null },
      include: { block: { include: { zone: { include: { warehouse: true } } } } },
    });
  }
  createRow(data: Prisma.RowCreateInput) {
    return this.prisma.row.create({ data });
  }

  findRack(id: string) {
    return this.prisma.rack.findFirst({
      where: { id, deletedAt: null },
      include: { row: { include: { block: { include: { zone: { include: { warehouse: true } } } } } } },
    });
  }
  createRack(data: Prisma.RackCreateInput) {
    return this.prisma.rack.create({ data });
  }

  findLevel(id: string) {
    return this.prisma.level.findFirst({
      where: { id, deletedAt: null },
      include: {
        rack: { include: { row: { include: { block: { include: { zone: { include: { warehouse: true } } } } } } } },
      },
    });
  }
  createLevel(data: Prisma.LevelCreateInput) {
    return this.prisma.level.create({ data });
  }

  findPositionByCode(locationCode: string) {
    return this.prisma.position.findUnique({
      where: { locationCode },
      include: {
        level: {
          include: {
            rack: { include: { row: { include: { block: { include: { zone: { include: { warehouse: true } } } } } } } },
          },
        },
      },
    });
  }
  createPosition(data: Prisma.PositionCreateInput) {
    return this.prisma.position.create({ data });
  }
  updatePosition(id: string, data: Prisma.PositionUpdateInput, client: Prisma.TransactionClient = this.prisma) {
    return client.position.update({ where: { id }, data });
  }
}
