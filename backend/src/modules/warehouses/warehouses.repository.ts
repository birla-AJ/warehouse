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

  findById(id: string, organizationId: string) {
    return this.prisma.warehouse.findFirst({ where: { id, organizationId, deletedAt: null } });
  }

  findByCode(organizationId: string, code: string) {
    return this.prisma.warehouse.findUnique({ where: { organizationId_code: { organizationId, code } } });
  }

  /** First active warehouse for the org — used to resolve a Floor/Chamber/Rack
   * assignment when the caller only supplies the three location codes. */
  findDefaultWarehouse(organizationId: string) {
    return this.prisma.warehouse.findFirst({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
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
  getLayout(warehouseId: string, organizationId: string) {
    return this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
      include: {
        floors: {
          where: { deletedAt: null },
          orderBy: { code: 'asc' },
          include: {
            chambers: {
              where: { deletedAt: null },
              orderBy: { code: 'asc' },
              include: {
                racks: { where: { deletedAt: null }, orderBy: { code: 'asc' } },
              },
            },
          },
        },
      },
    });
  }

  // ── Floor / Chamber / Rack ──────────────────────────────
  findFloor(id: string) {
    return this.prisma.floor.findFirst({ where: { id, deletedAt: null }, include: { warehouse: true } });
  }
  findFloorByCode(warehouseId: string, code: string) {
    return this.prisma.floor.findFirst({ where: { warehouseId, code, deletedAt: null } });
  }
  createFloor(data: Prisma.FloorCreateInput) {
    return this.prisma.floor.create({ data });
  }

  findChamber(id: string) {
    return this.prisma.chamber.findFirst({
      where: { id, deletedAt: null },
      include: { floor: { include: { warehouse: true } } },
    });
  }
  findChamberByCode(floorId: string, code: string) {
    return this.prisma.chamber.findFirst({ where: { floorId, code, deletedAt: null } });
  }
  createChamber(data: Prisma.ChamberCreateInput) {
    return this.prisma.chamber.create({ data });
  }

  findRack(id: string) {
    return this.prisma.rack.findFirst({
      where: { id, deletedAt: null },
      include: { chamber: { include: { floor: { include: { warehouse: true } } } } },
    });
  }
  findRackByCodeInChamber(chamberId: string, code: string) {
    return this.prisma.rack.findFirst({ where: { chamberId, code, deletedAt: null } });
  }
  findRackByLocationCode(locationCode: string) {
    return this.prisma.rack.findUnique({
      where: { locationCode },
      include: { chamber: { include: { floor: { include: { warehouse: true } } } } },
    });
  }
  createRack(data: Prisma.RackCreateInput) {
    return this.prisma.rack.create({ data });
  }
  updateRack(id: string, data: Prisma.RackUpdateInput, client: Prisma.TransactionClient = this.prisma) {
    return client.rack.update({ where: { id }, data });
  }
}
