import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BagsService } from './bags.service';
import { BagsRepository } from './bags.repository';
import { LocationsService } from '../warehouses/locations.service';

describe('BagsService', () => {
  let service: BagsService;
  let repo: any;
  let locationsService: any;

  // Fake transaction client: runs the callback with a marker object standing
  // in for Prisma's `tx`. Individual repo method mocks below ignore this
  // extra argument (jest mocks don't care about arity), so existing
  // assertions on the *business* args (position id, delta, etc.) keep working.
  const fakeTx = { marker: 'tx' };

  beforeEach(async () => {
    repo = {
      countAll: jest.fn().mockResolvedValue(0),
      findPosition: jest.fn(),
      create: jest.fn(),
      createMovement: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      runInTransaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(fakeTx)),
    };
    locationsService = { recalculateStatus: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BagsService,
        { provide: BagsRepository, useValue: repo },
        { provide: LocationsService, useValue: locationsService },
      ],
    }).compile();

    service = moduleRef.get(BagsService);
  });

  it('rejects intake into a FULL position', async () => {
    repo.findPosition.mockResolvedValue({ id: 'pos1', status: 'FULL', currentLoad: 5 });

    await expect(
      service.create({ farmerId: 'f1', cropId: 'c1', bagTypeId: 'bt1', weightKg: 50, positionId: 'pos1' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects intake into a DISABLED position', async () => {
    repo.findPosition.mockResolvedValue({ id: 'pos1', status: 'DISABLED', currentLoad: 0 });

    await expect(
      service.create({ farmerId: 'f1', cropId: 'c1', bagTypeId: 'bt1', weightKg: 50, positionId: 'pos1' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('bumps position load on successful intake', async () => {
    repo.findPosition
      .mockResolvedValueOnce({ id: 'pos1', status: 'EMPTY', currentLoad: 0 }) // availability check
      .mockResolvedValueOnce({ id: 'pos1', status: 'EMPTY', currentLoad: 0 }); // bumpPositionLoad lookup
    repo.create.mockResolvedValue({ id: 'bag1', bagCode: 'BAG-00000001' });

    await service.create({ farmerId: 'f1', cropId: 'c1', bagTypeId: 'bt1', weightKg: 50, positionId: 'pos1' } as any);

    expect(repo.runInTransaction).toHaveBeenCalled();
    expect(locationsService.recalculateStatus).toHaveBeenCalledWith('pos1', 1, fakeTx);
  });

  it('rejects moving a bag that is not IN_STORAGE', async () => {
    repo.findById.mockResolvedValue({ id: 'bag1', status: 'DISPATCHED', positionId: 'pos1' });

    await expect(service.move('bag1', { toPositionId: 'pos2' } as any)).rejects.toThrow(BadRequestException);
  });

  it('rejects moving to the same position', async () => {
    repo.findById.mockResolvedValue({ id: 'bag1', status: 'IN_STORAGE', positionId: 'pos1' });

    await expect(service.move('bag1', { toPositionId: 'pos1' } as any)).rejects.toThrow(BadRequestException);
  });

  it('decrements old position and increments new position on move', async () => {
    repo.findById
      .mockResolvedValueOnce({ id: 'bag1', status: 'IN_STORAGE', positionId: 'pos1' }) // getById in move()
      .mockResolvedValueOnce({ id: 'bag1', status: 'IN_STORAGE', positionId: 'pos2' }); // getById at end
    repo.findPosition
      .mockResolvedValueOnce({ id: 'pos2', status: 'EMPTY', currentLoad: 0 }) // availability check
      .mockResolvedValueOnce({ id: 'pos1', currentLoad: 3 }) // bump old
      .mockResolvedValueOnce({ id: 'pos2', currentLoad: 0 }); // bump new

    await service.move('bag1', { toPositionId: 'pos2' } as any);

    expect(repo.runInTransaction).toHaveBeenCalled();
    expect(locationsService.recalculateStatus).toHaveBeenCalledWith('pos1', 2, fakeTx);
    expect(locationsService.recalculateStatus).toHaveBeenCalledWith('pos2', 1, fakeTx);
  });

  it('marking a bag damaged frees its position', async () => {
    repo.findById.mockResolvedValue({ id: 'bag1', status: 'IN_STORAGE', positionId: 'pos1' });
    repo.update.mockResolvedValue({ id: 'bag1', status: 'DAMAGED' });
    repo.findPosition.mockResolvedValue({ id: 'pos1', currentLoad: 2 });

    await service.markDamaged('bag1', { note: 'wet bag' } as any);

    expect(repo.runInTransaction).toHaveBeenCalled();
    expect(locationsService.recalculateStatus).toHaveBeenCalledWith('pos1', 1, fakeTx);
  });

  it('throws NotFoundException for an unknown bag', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('reserve() rejects a bag that is not IN_STORAGE', async () => {
    repo.findById.mockResolvedValue({ id: 'bag1', status: 'DISPATCHED' });
    await expect(service.reserve('bag1')).rejects.toThrow(BadRequestException);
  });

  it('reserve() transitions IN_STORAGE to RESERVED', async () => {
    repo.findById.mockResolvedValue({ id: 'bag1', status: 'IN_STORAGE' });
    repo.update.mockResolvedValue({ id: 'bag1', status: 'RESERVED' });

    const result = await service.reserve('bag1');
    expect(repo.update).toHaveBeenCalledWith('bag1', { status: 'RESERVED' });
    expect(result.status).toBe('RESERVED');
  });

  it('unreserve() rejects a bag that is not RESERVED', async () => {
    repo.findById.mockResolvedValue({ id: 'bag1', status: 'IN_STORAGE' });
    await expect(service.unreserve('bag1')).rejects.toThrow(BadRequestException);
  });

  it('markDispatched() accepts a RESERVED bag', async () => {
    repo.findById.mockResolvedValue({ id: 'bag1', status: 'RESERVED', positionId: 'pos1' });
    repo.update.mockResolvedValue({ id: 'bag1', status: 'DISPATCHED' });
    repo.findPosition.mockResolvedValue({ id: 'pos1', currentLoad: 1 });

    const result = await service.markDispatched('bag1');
    expect(repo.runInTransaction).toHaveBeenCalled();
    expect(result.status).toBe('DISPATCHED');
  });
});
