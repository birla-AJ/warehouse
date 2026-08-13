import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private repo: WarehousesRepository) {}

  async list(organizationId: string, page = 1, limit = 20) {
    const where = { organizationId, deletedAt: null };
    const [items, total] = await Promise.all([
      this.repo.findMany(where, (page - 1) * limit, limit),
      this.repo.count(where),
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, organizationId: string) {
    const warehouse = await this.repo.findById(id, organizationId);
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async create(organizationId: string, dto: CreateWarehouseDto) {
    const existing = await this.repo.findByCode(organizationId, dto.code);
    if (existing) throw new ConflictException('Warehouse code already in use');

    return this.repo.createWarehouse({
      name: dto.name,
      code: dto.code,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      capacityUnit: dto.capacityUnit ?? 'bags',
      totalCapacity: dto.totalCapacity ?? 0,
      organization: { connect: { id: organizationId } },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateWarehouseDto) {
    await this.getById(id, organizationId);
    return this.repo.updateWarehouse(id, dto);
  }

  async remove(id: string, organizationId: string) {
    await this.getById(id, organizationId);
    await this.repo.softDeleteWarehouse(id);
    return { message: 'Warehouse deactivated' };
  }

  /**
   * Full nested layout with occupancy color coding for the visual map:
   * green = EMPTY, yellow = PARTIAL, red = FULL, grey = DISABLED.
   * Also rolls up an occupancy summary at each level of the tree.
   */
  async getLayout(id: string, organizationId: string) {
    const warehouse = await this.repo.getLayout(id, organizationId);
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const colorMap: Record<string, string> = {
      EMPTY: 'green',
      PARTIAL: 'yellow',
      FULL: 'red',
      DISABLED: 'grey',
    };

    let totalPositions = 0;
    let occupiedPositions = 0;

    const zones = warehouse.zones.map((zone) => ({
      id: zone.id,
      code: zone.code,
      name: zone.name,
      blocks: zone.blocks.map((block) => ({
        id: block.id,
        code: block.code,
        name: block.name,
        rows: block.rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          racks: row.racks.map((rack) => ({
            id: rack.id,
            code: rack.code,
            name: rack.name,
            levels: rack.levels.map((level) => ({
              id: level.id,
              code: level.code,
              name: level.name,
              positions: level.positions.map((position) => {
                totalPositions += 1;
                if (position.status === 'PARTIAL' || position.status === 'FULL') occupiedPositions += 1;
                return {
                  id: position.id,
                  code: position.code,
                  locationCode: position.locationCode,
                  status: position.status,
                  color: colorMap[position.status],
                  capacity: position.capacity,
                  currentLoad: position.currentLoad,
                };
              }),
            })),
          })),
        })),
      })),
    }));

    return {
      warehouse: { id: warehouse.id, name: warehouse.name, code: warehouse.code },
      occupancy: {
        totalPositions,
        occupiedPositions,
        occupancyPercent: totalPositions === 0 ? 0 : Math.round((occupiedPositions / totalPositions) * 10000) / 100,
      },
      zones,
    };
  }
}
