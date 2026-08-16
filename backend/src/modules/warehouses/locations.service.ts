import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WarehousesRepository } from './warehouses.repository';
import { CreateLocationNodeDto, CreateRackDto, UpdateRackStatusDto } from './dto/location.dto';

@Injectable()
export class LocationsService {
  constructor(private repo: WarehousesRepository) {}

  async createFloor(warehouseId: string, dto: CreateLocationNodeDto) {
    return this.createFloorInternal(warehouseId, dto);
  }

  private async createFloorInternal(warehouseId: string, dto: CreateLocationNodeDto) {
    return this.repo
      .createFloor({
        code: dto.code,
        name: dto.name,
        warehouse: { connect: { id: warehouseId } },
      })
      .catch(() => {
        throw new ConflictException('Floor code already exists in this warehouse');
      });
  }

  async createChamber(floorId: string, dto: CreateLocationNodeDto) {
    const floor = await this.repo.findFloor(floorId);
    if (!floor) throw new NotFoundException('Floor not found');

    return this.repo
      .createChamber({ code: dto.code, name: dto.name, floor: { connect: { id: floorId } } })
      .catch(() => {
        throw new ConflictException('Chamber code already exists on this floor');
      });
  }

  async createRack(chamberId: string, dto: CreateRackDto) {
    const chamber = await this.repo.findChamber(chamberId);
    if (!chamber) throw new NotFoundException('Chamber not found');

    const { floor } = chamber;
    const { warehouse } = floor;
    const locationCode = buildLocationCode(warehouse.code, floor.code, chamber.code, dto.code);

    return this.repo
      .createRack({
        code: dto.code,
        name: dto.name,
        locationCode,
        capacity: dto.capacity ?? 1,
        chamber: { connect: { id: chamberId } },
      })
      .catch(() => {
        throw new ConflictException('Rack code already exists in this chamber, or location code collided');
      });
  }

  async getRackByCode(locationCode: string) {
    const rack = await this.repo.findRackByLocationCode(locationCode);
    if (!rack) throw new NotFoundException('Rack not found');
    return rack;
  }

  /**
   * Resolves the storage spot for a batch from just the three inputs the
   * "Assign location" screen collects (floor / chamber / rack codes),
   * auto-creating any Floor, Chamber, or Rack that doesn't exist yet under
   * the organization's warehouse. This lets staff type a location straight
   * in without pre-building the warehouse layout node-by-node first.
   */
  async resolveOrCreateRack(organizationId: string, floorCode: string, chamberCode: string, rackCode: string) {
    const warehouse = await this.repo.findDefaultWarehouse(organizationId);
    if (!warehouse) {
      throw new BadRequestException('No warehouse is set up for this organization yet');
    }

    const floor =
      (await this.repo.findFloorByCode(warehouse.id, floorCode)) ??
      (await this.createFloorInternal(warehouse.id, { code: floorCode }).catch(async () => {
        // Lost a create race — someone else just made this floor code.
        return this.repo.findFloorByCode(warehouse.id, floorCode);
      }));
    if (!floor) throw new BadRequestException('Could not resolve floor');

    const chamber =
      (await this.repo.findChamberByCode(floor.id, chamberCode)) ??
      (await this.repo
        .createChamber({ code: chamberCode, floor: { connect: { id: floor.id } } })
        .catch(async () => this.repo.findChamberByCode(floor.id, chamberCode)));
    if (!chamber) throw new BadRequestException('Could not resolve chamber');

    let rack = await this.repo.findRackByCodeInChamber(chamber.id, rackCode);
    if (!rack) {
      const locationCode = buildLocationCode(warehouse.code, floorCode, chamberCode, rackCode);
      rack = await this.repo
        .createRack({
          code: rackCode,
          locationCode,
          chamber: { connect: { id: chamber.id } },
        })
        .catch(async () => this.repo.findRackByCodeInChamber(chamber.id, rackCode));
    }
    if (!rack) throw new BadRequestException('Could not resolve rack');

    return rack;
  }

  /**
   * Manual status override (e.g. marking a rack DISABLED for maintenance).
   * Normal EMPTY/PARTIAL/FULL transitions are driven automatically by the
   * Inventory module as bags are placed/removed — see recalculateStatus().
   */
  async setRackStatus(rackId: string, dto: UpdateRackStatusDto) {
    return this.repo.updateRack(rackId, { status: dto.status });
  }

  /**
   * Recomputes EMPTY/PARTIAL/FULL from currentLoad vs capacity.
   * Called by the Inventory module after any bag placement/removal.
   * Exported for reuse — never called with a DISABLED rack (skip those).
   * Accepts an optional transaction client so BagsService can run the whole
   * move/damage/dispatch operation (bag update + movement log + rack
   * load/status recalc) atomically instead of as separate, individually
   * committed writes — avoids a lost-update race under concurrent moves.
   */
  async recalculateStatus(rackId: string, currentLoad: number, tx?: Prisma.TransactionClient) {
    if (currentLoad < 0) throw new BadRequestException('currentLoad cannot be negative');

    const rack = await this.repo.updateRack(rackId, { currentLoad }, tx);
    let status: 'EMPTY' | 'PARTIAL' | 'FULL' = 'EMPTY';
    if (rack.status !== 'DISABLED') {
      if (currentLoad <= 0) status = 'EMPTY';
      else if (currentLoad >= Number(rack.capacity)) status = 'FULL';
      else status = 'PARTIAL';

      return this.repo.updateRack(rackId, { status }, tx);
    }
    return rack;
  }
}

function buildLocationCode(warehouseCode: string, floorCode: string, chamberCode: string, rackCode: string) {
  return [warehouseCode, `F${floorCode}`, `C${chamberCode}`, `R${rackCode}`].join('-');
}
