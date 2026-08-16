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
   * Full nested layout (Floor → Chamber → Rack) with occupancy color coding
   * for the visual map: green = EMPTY, yellow = PARTIAL, red = FULL,
   * grey = DISABLED. Also rolls up an occupancy summary for the warehouse.
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

    let totalRacks = 0;
    let occupiedRacks = 0;

    const floors = warehouse.floors.map((floor) => ({
      id: floor.id,
      code: floor.code,
      name: floor.name,
      chambers: floor.chambers.map((chamber) => ({
        id: chamber.id,
        code: chamber.code,
        name: chamber.name,
        racks: chamber.racks.map((rack) => {
          totalRacks += 1;
          if (rack.status === 'PARTIAL' || rack.status === 'FULL') occupiedRacks += 1;
          return {
            id: rack.id,
            code: rack.code,
            locationCode: rack.locationCode,
            status: rack.status,
            color: colorMap[rack.status],
            capacity: rack.capacity,
            currentLoad: rack.currentLoad,
          };
        }),
      })),
    }));

    return {
      warehouse: { id: warehouse.id, name: warehouse.name, code: warehouse.code },
      occupancy: {
        totalRacks,
        occupiedRacks,
        occupancyPercent: totalRacks === 0 ? 0 : Math.round((occupiedRacks / totalRacks) * 10000) / 100,
      },
      floors,
    };
  }
}
