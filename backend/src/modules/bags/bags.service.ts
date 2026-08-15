import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BagsRepository } from './bags.repository';
import { LocationsService } from '../warehouses/locations.service';
import {
  CreateBagDto,
  AdjustBagDto,
  ListBagsQueryDto,
  DamageBatchDto,
  MoveBatchDto,
  ListBatchesQueryDto,
} from './dto/bag.dto';
import { QrUtil } from '../../common/utils/qr.util';

@Injectable()
export class BagsService {
  constructor(
    private repo: BagsRepository,
    private locationsService: LocationsService,
  ) {}

  async list(organizationId: string, query: ListBagsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const where = {
      deletedAt: null,
      farmer: { organizationId },
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

  async getById(id: string, organizationId: string) {
    const bag = await this.repo.findById(id, organizationId);
    if (!bag) throw new NotFoundException('Bag not found');
    return bag;
  }

  async getByQrCode(qrCode: string, organizationId: string) {
    const bag = await this.repo.findByQrCode(qrCode, organizationId);
    if (!bag) throw new NotFoundException('No bag found for this QR code');
    return bag;
  }

  /**
   * Intake: creates every physical bag for this delivery, generating each
   * one's QR code, and stamps them all with one auto-generated batch code
   * (farmerCode-cropCode-date-seq). Bags are intentionally left unassigned
   * to a position here — storage location is now a batch-level action
   * (see moveBatch) done after receiving, not part of intake.
   */
  async create(organizationId: string, dto: CreateBagDto, performedById?: string) {
    const bagCount = dto.bagCount ?? 1;
    const bagTypeId = await this.resolveBagTypeId(dto);
    const totalWeightKg = Number(dto.weightKg);
    const batchId = await this.generateBatchCode(organizationId, dto.farmerId, dto.cropId);

    if (bagCount === 1) {
      return this.createOne({ ...dto, bagTypeId, weightKg: totalWeightKg, batchId }, performedById);
    }

    const standardWeightKg = Number(dto.bagSizeKg);
    const minimumTotalWeight = (bagCount - 1) * standardWeightKg + 0.1;
    if (totalWeightKg < minimumTotalWeight) {
      throw new BadRequestException('Total weight is too low for the selected number of bags');
    }

    // Store one record and QR code per physical bag (still needed for
    // per-bag audit trail even though the app only surfaces batches). Any
    // extra loose crop is added to the final bag so weights sum to the total.
    const bags = [];
    for (let index = 0; index < bagCount; index += 1) {
      const weightKg = index === bagCount - 1
        ? totalWeightKg - standardWeightKg * (bagCount - 1)
        : standardWeightKg;
      bags.push(await this.createOne({ ...dto, bagTypeId, bagCount: undefined, weightKg, batchId }, performedById));
    }

    return { batchId, bags, count: bags.length, totalWeightKg };
  }

  private async createOne(dto: CreateBagDto & { bagTypeId: string; batchId: string }, performedById?: string) {
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

  private async resolveBagTypeId(dto: CreateBagDto) {
    if (dto.bagTypeId) return dto.bagTypeId;

    const standardBagSizes = [10, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
    const bagSizeKg = Number(dto.bagSizeKg);
    if (!standardBagSizes.includes(bagSizeKg)) {
      throw new BadRequestException('Select a valid bag type');
    }

    const bagType = await this.repo.upsertStandardBagType(bagSizeKg);
    return bagType.id;
  }

  /**
   * Builds a readable, farmer+crop+date scoped batch code, e.g.
   * `FARM-000006-CHILI-20260815-01`. The trailing sequence disambiguates a
   * farmer bringing the same crop more than once on the same day — each
   * visit is a separate batch.
   */
  private async generateBatchCode(organizationId: string, farmerId: string, cropId: string): Promise<string> {
    const { farmerCode, cropName } = await this.repo.findFarmerAndCropCodes(organizationId, farmerId, cropId);
    if (!farmerCode) throw new NotFoundException('Farmer not found');
    if (!cropName) throw new NotFoundException('Crop not found');

    const cropCode = cropName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'CROP';
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `${farmerCode}-${cropCode}-${datePart}`;

    const existing = await this.repo.findBatchIdsByPrefix(prefix);
    const seq = (existing.length + 1).toString().padStart(2, '0');
    return `${prefix}-${seq}`;
  }

  /**
   * Batch-grouped inventory view — one row per batch instead of one per
   * physical bag. This is the primary Inventory listing now.
   */
  async listBatches(organizationId: string, query: ListBatchesQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const [representatives, total] = await Promise.all([
      this.repo.findBatchSummaries(organizationId, {
        farmerId: query.farmerId,
        cropId: query.cropId,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.repo.countBatches(organizationId, { farmerId: query.farmerId, cropId: query.cropId }),
    ]);

    const batchIds = representatives.map((b) => b.batchId);
    const [statusRows, positionRows] = await Promise.all([
      batchIds.length ? this.repo.groupBatchStatus(organizationId, batchIds) : Promise.resolve([]),
      batchIds.length ? this.repo.findBatchPositions(organizationId, batchIds) : Promise.resolve([]),
    ]);

    const positionByBatch = new Map(positionRows.map((b) => [b.batchId, b.position]));

    const items = representatives.map((rep) => {
      const rows = statusRows.filter((r) => r.batchId === rep.batchId);
      const totalBags = rows.reduce((sum, r) => sum + r._count, 0);
      const inStorageRow = rows.find((r) => r.status === 'IN_STORAGE');
      const damagedRow = rows.find((r) => r.status === 'DAMAGED');
      const dispatchedRow = rows.find((r) => r.status === 'DISPATCHED');
      const inStorageCount = inStorageRow?._count ?? 0;
      const damagedCount = damagedRow?._count ?? 0;
      const dispatchedCount = dispatchedRow?._count ?? 0;

      let status: 'IN_STORAGE' | 'PARTIALLY_DISPATCHED' | 'DISPATCHED' | 'DAMAGED' = 'IN_STORAGE';
      if (inStorageCount === 0 && damagedCount === totalBags && totalBags > 0) status = 'DAMAGED';
      else if (inStorageCount === 0 && dispatchedCount > 0) status = 'DISPATCHED';
      else if (dispatchedCount > 0 || damagedCount > 0) status = 'PARTIALLY_DISPATCHED';

      return {
        batchId: rep.batchId,
        farmer: rep.farmer,
        crop: rep.crop,
        grade: rep.grade,
        receivedAt: rep.receivedAt,
        totalBags,
        inStorageCount,
        damagedCount,
        dispatchedCount,
        weightKg: Number(inStorageRow?._sum.weightKg ?? 0),
        position: positionByBatch.get(rep.batchId) ?? null,
        status,
      };
    });

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Assigns (or changes) the storage location for an entire batch in one
   * shot — every IN_STORAGE bag in the batch moves together, since bags of
   * the same batch are always kept in the same spot.
   */
  async moveBatch(organizationId: string, batchId: string, dto: MoveBatchDto, performedById?: string) {
    const bags = await this.repo.findBatchBagsInStorage(organizationId, batchId);
    if (bags.length === 0) throw new NotFoundException('No in-storage bags found for this batch');

    const position = await this.repo.findPositionByCode(dto.locationCode);
    if (!position) throw new NotFoundException(`No storage location found for code "${dto.locationCode}"`);
    await this.assertPositionAvailable(position.id);

    await this.repo.runInTransaction(async (tx) => {
      for (const bag of bags) {
        const fromPositionId = bag.positionId;
        if (fromPositionId === position.id) continue;

        await this.repo.update(bag.id, { position: { connect: { id: position.id } } }, tx);
        await this.repo.createMovement(
          {
            bag: { connect: { id: bag.id } },
            type: fromPositionId ? 'TRANSFER' : 'RECEIVE',
            fromPositionId: fromPositionId ?? undefined,
            toPositionId: position.id,
            quantity: 1,
            note: dto.note,
            performedById,
          },
          tx,
        );

        if (fromPositionId) await this.bumpPositionLoad(fromPositionId, -1, tx);
        await this.bumpPositionLoad(position.id, +1, tx);
      }
    });

    return { batchId, locationCode: dto.locationCode, bagsMoved: bags.length };
  }

  /**
   * Marks `count` bags of a batch DAMAGED (oldest bag-codes first — an
   * arbitrary but stable choice since individual bags aren't distinguished
   * in the UI) and frees their positions. Weight removed is the actual sum
   * of those bags' recorded weights, not an estimate.
   */
  async damageBatch(organizationId: string, batchId: string, dto: DamageBatchDto, performedById?: string) {
    if (dto.bagCount < 1) throw new BadRequestException('Number of damaged bags must be at least 1');

    const bags = await this.repo.findBatchBagsInStorage(organizationId, batchId, dto.bagCount);
    if (bags.length < dto.bagCount) {
      throw new BadRequestException(`Only ${bags.length} bag(s) currently in storage for this batch`);
    }

    let weightKg = 0;

    await this.repo.runInTransaction(async (tx) => {
      for (const bag of bags) {
        await this.repo.update(bag.id, { status: 'DAMAGED' }, tx);
        await this.repo.createMovement(
          {
            bag: { connect: { id: bag.id } },
            type: 'DAMAGE',
            fromPositionId: bag.positionId ?? undefined,
            quantity: 1,
            note: dto.note,
            performedById,
          },
          tx,
        );
        if (bag.positionId) await this.bumpPositionLoad(bag.positionId, -1, tx);
        weightKg += Number(bag.weightKg);
      }
    });

    return { batchId, damagedCount: bags.length, weightKg };
  }

  /**
   * Dispatches `count` bags of a batch immediately (no OTP/QR gate step —
   * see DispatchService). Returns the bags picked so the caller can link
   * them to the Dispatch record.
   */
  async dispatchFromBatch(organizationId: string, batchId: string, count: number, performedById?: string) {
    if (count < 1) throw new BadRequestException('Number of bags to dispatch must be at least 1');

    const bags = await this.repo.findBatchBagsInStorage(organizationId, batchId, count);
    if (bags.length < count) {
      throw new BadRequestException(`Only ${bags.length} bag(s) currently in storage for this batch`);
    }

    await this.repo.runInTransaction(async (tx) => {
      for (const bag of bags) {
        await this.repo.update(bag.id, { status: 'DISPATCHED', position: { disconnect: true } }, tx);
        await this.repo.createMovement(
          {
            bag: { connect: { id: bag.id } },
            type: 'DISPATCH',
            fromPositionId: bag.positionId ?? undefined,
            quantity: 1,
            performedById,
          },
          tx,
        );
        if (bag.positionId) await this.bumpPositionLoad(bag.positionId, -1, tx);
      }
    });

    return bags;
  }

  async adjust(bagId: string, organizationId: string, dto: AdjustBagDto, performedById?: string) {
    await this.getById(bagId, organizationId);
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

  async listMovements(organizationId: string, bagId?: string, page = 1, limit = 20) {
    const where = { bag: { farmer: { organizationId } }, ...(bagId ? { bagId } : {}) };
    const [items, total] = await Promise.all([
      this.repo.findMovements(where, (page - 1) * limit, limit),
      this.repo.countMovements(where),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async summary(organizationId: string) {
    const [byStatus, byCrop] = await Promise.all([
      this.repo.groupByStatus(organizationId),
      this.repo.groupByCrop(organizationId),
    ]);
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
