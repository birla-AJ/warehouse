import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BagsRepository } from './bags.repository';
import { LocationsService } from '../warehouses/locations.service';
import { CreateBagDto, MoveBagDto, AdjustBagDto, DamageBagDto, ListBagsQueryDto } from './dto/bag.dto';
import { QrUtil } from '../../common/utils/qr.util';

@Injectable()
export class BagsService {
  constructor(
    private repo: BagsRepository,
    private locationsService: LocationsService,
  ) {}

  async list(query: ListBagsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const where = {
      deletedAt: null,
      ...(query.farmerId ? { farmerId: query.farmerId } : {}),
      ...(query.cropId ? { cropId: query.cropId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };

    const [items, total] = await Promise.all([
      this.repo.findMany(where, (page - 1) * limit, limit),
      this.repo.count(where),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const bag = await this.repo.findById(id);
    if (!bag) throw new NotFoundException('Bag not found');
    return bag;
  }

  async getByQrCode(qrCode: string) {
    const bag = await this.repo.findByQrCode(qrCode);
    if (!bag) throw new NotFoundException('No bag found for this QR code');
    return bag;
  }

  /**
   * Intake: creates the bag, generates its QR, and — if a position is given —
   * places it. Runs as a single transaction: bag creation, the movement log
   * entry, and the position's load bump all commit together or not at all.
   */
  async create(dto: CreateBagDto, performedById?: string) {
    const bagCode = await this.generateBagCode();
    const qrCode = QrUtil.generateToken(bagCode);

    if (dto.positionId) {
      await this.assertPositionAvailable(dto.positionId);
    }

    return this.repo.runInTransaction(async (tx) => {
      const bag = await this.repo.create(
        {
          bagCode,
          qrCode,
          farmer: { connect: { id: dto.farmerId } },
          crop: { connect: { id: dto.cropId } },
          bagType: { connect: { id: dto.bagTypeId } },
          batchId: dto.batchId,
          grade: dto.grade ?? 'A',
          weightKg: dto.weightKg,
          position: dto.positionId ? { connect: { id: dto.positionId } } : undefined,
        },
        tx,
      );

      if (dto.positionId) {
        await this.repo.createMovement(
          {
            bag: { connect: { id: bag.id } },
            type: 'RECEIVE',
            toPositionId: dto.positionId,
            quantity: 1,
            performedById,
          },
          tx,
        );
        await this.bumpPositionLoad(dto.positionId, +1, tx);
      }

      return bag;
    });
  }

  /**
   * Moves a bag between positions. The old-position decrement, new-position
   * increment, bag update, and movement log entry all run in one transaction
   * — if any step fails, none of them commit, so a position's currentLoad can
   * never drift out of sync with its actual bags (the previous version did
   * these as four separate, individually-committed writes).
   */
  async move(bagId: string, dto: MoveBagDto, performedById?: string) {
    const bag = await this.getById(bagId);
    if (bag.status !== 'IN_STORAGE') {
      throw new BadRequestException(`Cannot move a bag with status ${bag.status}`);
    }
    if (bag.positionId === dto.toPositionId) {
      throw new BadRequestException('Bag is already at this position');
    }

    await this.assertPositionAvailable(dto.toPositionId);

    const fromPositionId = bag.positionId;

    await this.repo.runInTransaction(async (tx) => {
      await this.repo.update(bagId, { position: { connect: { id: dto.toPositionId } } }, tx);
      await this.repo.createMovement(
        {
          bag: { connect: { id: bagId } },
          type: 'TRANSFER',
          fromPositionId: fromPositionId ?? undefined,
          toPositionId: dto.toPositionId,
          quantity: 1,
          note: dto.note,
          performedById,
        },
        tx,
      );

      if (fromPositionId) await this.bumpPositionLoad(fromPositionId, -1, tx);
      await this.bumpPositionLoad(dto.toPositionId, +1, tx);
    });

    return this.getById(bagId);
  }

  async adjust(bagId: string, dto: AdjustBagDto, performedById?: string) {
    await this.getById(bagId);
    const updated = await this.repo.update(bagId, { weightKg: dto.weightKg });

    await this.repo.createMovement({
      bag: { connect: { id: bagId } },
      type: 'ADJUST',
      quantity: dto.weightKg,
      note: dto.note,
      performedById,
    });

    return updated;
  }

  /** Marks a bag DAMAGED and frees its position, atomically. */
  async markDamaged(bagId: string, dto: DamageBagDto, performedById?: string) {
    const bag = await this.getById(bagId);

    const updated = await this.repo.runInTransaction(async (tx) => {
      const result = await this.repo.update(bagId, { status: 'DAMAGED' }, tx);

      await this.repo.createMovement(
        {
          bag: { connect: { id: bagId } },
          type: 'DAMAGE',
          fromPositionId: bag.positionId ?? undefined,
          quantity: 1,
          note: dto.note,
          performedById,
        },
        tx,
      );

      if (bag.positionId) await this.bumpPositionLoad(bag.positionId, -1, tx);

      return result;
    });

    return updated;
  }

  async reserve(bagId: string) {
    const bag = await this.getById(bagId);
    if (bag.status !== 'IN_STORAGE') {
      throw new BadRequestException(`Cannot reserve a bag with status ${bag.status}`);
    }
    return this.repo.update(bagId, { status: 'RESERVED' });
  }

  async unreserve(bagId: string) {
    const bag = await this.getById(bagId);
    if (bag.status !== 'RESERVED') {
      throw new BadRequestException(`Cannot unreserve a bag with status ${bag.status}`);
    }
    return this.repo.update(bagId, { status: 'IN_STORAGE' });
  }

  /** Marks a bag DISPATCHED and frees its position, atomically. */
  async markDispatched(bagId: string, performedById?: string) {
    const bag = await this.getById(bagId);
    if (bag.status !== 'IN_STORAGE' && bag.status !== 'RESERVED') {
      throw new BadRequestException(`Cannot dispatch a bag with status ${bag.status}`);
    }

    return this.repo.runInTransaction(async (tx) => {
      const updated = await this.repo.update(bagId, { status: 'DISPATCHED', position: { disconnect: true } }, tx);

      await this.repo.createMovement(
        {
          bag: { connect: { id: bagId } },
          type: 'DISPATCH',
          fromPositionId: bag.positionId ?? undefined,
          quantity: 1,
          performedById,
        },
        tx,
      );

      if (bag.positionId) await this.bumpPositionLoad(bag.positionId, -1, tx);

      return updated;
    });
  }

  async listMovements(bagId?: string, page = 1, limit = 20) {
    const where = bagId ? { bagId } : {};
    const [items, total] = await Promise.all([
      this.repo.findMovements(where, (page - 1) * limit, limit),
      this.repo.countMovements(where),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async summary() {
    const [byStatus, byCrop] = await Promise.all([this.repo.groupByStatus(), this.repo.groupByCrop()]);
    return {
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count })),
      byCrop: byCrop.map((row) => ({
        cropId: row.cropId,
        count: row._count,
        totalWeightKg: row._sum.weightKg,
      })),
    };
  }

  // ── internal helpers ──────────────────────────────────────

  private async assertPositionAvailable(positionId: string) {
    const position = await this.repo.findPosition(positionId);
    if (!position) throw new NotFoundException('Position not found');
    if (position.status === 'DISABLED') throw new BadRequestException('Position is disabled');
    if (position.status === 'FULL') throw new BadRequestException('Position is already full');
  }

  private async bumpPositionLoad(positionId: string, delta: number, tx?: Prisma.TransactionClient) {
    const position = await this.repo.findPosition(positionId, tx);
    if (!position) return;
    const newLoad = Math.max(0, Number(position.currentLoad) + delta);
    await this.locationsService.recalculateStatus(positionId, newLoad, tx);
  }

  private async generateBagCode(): Promise<string> {
    const count = await this.repo.countAll();
    return `BAG-${(count + 1).toString().padStart(8, '0')}`;
  }
}
