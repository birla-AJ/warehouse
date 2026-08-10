import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WarehousesRepository } from './warehouses.repository';
import { CreateLocationNodeDto, CreatePositionDto, UpdatePositionStatusDto } from './dto/location.dto';

@Injectable()
export class LocationsService {
  constructor(private repo: WarehousesRepository) {}

  async createZone(warehouseId: string, dto: CreateLocationNodeDto) {
    const warehouse = await this.repo.findById(warehouseId);
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    return this.repo
      .createZone({
        code: dto.code,
        name: dto.name,
        warehouse: { connect: { id: warehouseId } },
      })
      .catch(() => {
        throw new ConflictException('Zone code already exists in this warehouse');
      });
  }

  async createBlock(zoneId: string, dto: CreateLocationNodeDto) {
    const zone = await this.repo.findZone(zoneId);
    if (!zone) throw new NotFoundException('Zone not found');

    return this.repo
      .createBlock({ code: dto.code, name: dto.name, zone: { connect: { id: zoneId } } })
      .catch(() => {
        throw new ConflictException('Block code already exists in this zone');
      });
  }

  async createRow(blockId: string, dto: CreateLocationNodeDto) {
    const block = await this.repo.findBlock(blockId);
    if (!block) throw new NotFoundException('Block not found');

    return this.repo
      .createRow({ code: dto.code, name: dto.name, block: { connect: { id: blockId } } })
      .catch(() => {
        throw new ConflictException('Row code already exists in this block');
      });
  }

  async createRack(rowId: string, dto: CreateLocationNodeDto) {
    const row = await this.repo.findRow(rowId);
    if (!row) throw new NotFoundException('Row not found');

    return this.repo
      .createRack({ code: dto.code, name: dto.name, row: { connect: { id: rowId } } })
      .catch(() => {
        throw new ConflictException('Rack code already exists in this row');
      });
  }

  async createLevel(rackId: string, dto: CreateLocationNodeDto) {
    const rack = await this.repo.findRack(rackId);
    if (!rack) throw new NotFoundException('Rack not found');

    return this.repo
      .createLevel({ code: dto.code, name: dto.name, rack: { connect: { id: rackId } } })
      .catch(() => {
        throw new ConflictException('Level code already exists in this rack');
      });
  }

  async createPosition(levelId: string, dto: CreatePositionDto) {
    const level = await this.repo.findLevel(levelId);
    if (!level) throw new NotFoundException('Level not found');

    const { rack } = level;
    const { row } = rack;
    const { block } = row;
    const { zone } = block;
    const { warehouse } = zone;

    const locationCode = [
      warehouse.code,
      `Z${zone.code}`,
      `B${block.code}`,
      `RW${row.code}`,
      `RK${rack.code}`,
      `L${level.code}`,
      `P${dto.code}`,
    ].join('-');

    return this.repo
      .createPosition({
        code: dto.code,
        locationCode,
        capacity: dto.capacity ?? 1,
        level: { connect: { id: levelId } },
      })
      .catch(() => {
        throw new ConflictException('Position code already exists at this level, or location code collided');
      });
  }

  async getPositionByCode(locationCode: string) {
    const position = await this.repo.findPositionByCode(locationCode);
    if (!position) throw new NotFoundException('Position not found');
    return position;
  }

  /**
   * Manual status override (e.g. marking a position DISABLED for maintenance).
   * Normal EMPTY/PARTIAL/FULL transitions are driven automatically by the
   * Inventory module as bags are placed/removed — see recalculateStatus().
   */
  async setPositionStatus(positionId: string, dto: UpdatePositionStatusDto) {
    return this.repo.updatePosition(positionId, { status: dto.status });
  }

  /**
   * Recomputes EMPTY/PARTIAL/FULL from currentLoad vs capacity.
   * Called by the Inventory module after any bag placement/removal.
   * Exported for reuse — never called with a DISABLED position (skip those).
   * Accepts an optional transaction client so BagsService can run the whole
   * move/damage/dispatch operation (bag update + movement log + position
   * load/status recalc) atomically instead of as separate, individually
   * committed writes — avoids a lost-update race under concurrent moves.
   */
  async recalculateStatus(positionId: string, currentLoad: number, tx?: Prisma.TransactionClient) {
    if (currentLoad < 0) throw new BadRequestException('currentLoad cannot be negative');

    const position = await this.repo.updatePosition(positionId, { currentLoad }, tx);
    let status: 'EMPTY' | 'PARTIAL' | 'FULL' = 'EMPTY';
    if (position.status !== 'DISABLED') {
      if (currentLoad <= 0) status = 'EMPTY';
      else if (currentLoad >= Number(position.capacity)) status = 'FULL';
      else status = 'PARTIAL';

      return this.repo.updatePosition(positionId, { status }, tx);
    }
    return position;
  }
}
