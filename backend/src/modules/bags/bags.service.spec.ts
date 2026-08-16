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
  // assertions on the *business* args (rack id, delta, etc.) keep working.
  const fakeTx = { marker: 'tx' };

  beforeEach(async () => {
    repo = {
      countAll: jest.fn().mockResolvedValue(0),
      findRack: jest.fn(),
      create: jest.fn(),
      createMovement: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findBatchBagsInStorage: jest.fn(),
      runInTransaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(fakeTx)),
    };
    locationsService = { recalculateStatus: jest.fn(), resolveOrCreateRack: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BagsService,
        { provide: BagsRepository, useValue: repo },
        { provide: LocationsService, useValue: locationsService },
      ],
    }).compile();

    service = moduleRef.get(BagsService);
  });

  it('rejects intake into a FULL rack', async () => {
    repo.findRack.mockResolvedValue({ id: 'rack1', status: 'FULL', currentLoad: 5 });

    await expect(
      service.create('org1', { farmerId: 'f1', cropId: 'c1', bagTypeId: 'bt1', weightKg: 50, rackId: 'rack1' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects intake into a DISABLED rack', async () => {
    repo.findRack.mockResolvedValue({ id: 'rack1', status: 'DISABLED', currentLoad: 0 });

    await expect(
      service.create('org1', { farmerId: 'f1', cropId: 'c1', bagTypeId: 'bt1', weightKg: 50, rackId: 'rack1' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('bumps rack load on successful intake', async () => {
    repo.findRack
      .mockResolvedValueOnce({ id: 'rack1', status: 'EMPTY', currentLoad: 0 }) // availability check
      .mockResolvedValueOnce({ id: 'rack1', status: 'EMPTY', currentLoad: 0 }); // bumpRackLoad lookup
    repo.findFarmerAndCropCodes = jest.fn().mockResolvedValue({ farmerCode: 'FARM-1', cropName: 'Chilli' });
    repo.findBatchIdsByPrefix = jest.fn().mockResolvedValue([]);
    repo.create.mockResolvedValue({ id: 'bag1', bagCode: 'BAG-00000001' });

    await service.create('org1', { farmerId: 'f1', cropId: 'c1', bagTypeId: 'bt1', weightKg: 50, rackId: 'rack1' } as any);

    expect(repo.runInTransaction).toHaveBeenCalled();
    expect(locationsService.recalculateStatus).toHaveBeenCalledWith('rack1', 1, fakeTx);
  });

  it('throws NotFoundException when no in-storage bags exist for the batch', async () => {
    repo.findBatchBagsInStorage.mockResolvedValue([]);

    await expect(
      service.moveBatch('org1', 'BATCH-1', { floorCode: '1', chamberCode: 'A', rackCode: '12' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects moving to a FULL rack', async () => {
    repo.findBatchBagsInStorage.mockResolvedValue([{ id: 'bag1', rackId: null }]);
    locationsService.resolveOrCreateRack.mockResolvedValue({ id: 'rack1', status: 'FULL', locationCode: 'WH1-F1-CA-R12' });
    repo.findRack.mockResolvedValue({ id: 'rack1', status: 'FULL' });

    await expect(
      service.moveBatch('org1', 'BATCH-1', { floorCode: '1', chamberCode: 'A', rackCode: '12' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('moves every in-storage bag of a batch to the resolved rack, bumping loads', async () => {
    repo.findBatchBagsInStorage.mockResolvedValue([
      { id: 'bag1', rackId: 'oldRack' },
      { id: 'bag2', rackId: null },
    ]);
    locationsService.resolveOrCreateRack.mockResolvedValue({ id: 'newRack', status: 'EMPTY', locationCode: 'WH1-F1-CA-R12' });
    repo.findRack
      .mockResolvedValueOnce({ id: 'newRack', status: 'EMPTY' }) // availability check
      .mockResolvedValueOnce({ id: 'oldRack', currentLoad: 3 }) // bump old (bag1)
      .mockResolvedValueOnce({ id: 'newRack', currentLoad: 0 }) // bump new (bag1)
      .mockResolvedValueOnce({ id: 'newRack', currentLoad: 1 }); // bump new (bag2)

    const result = await service.moveBatch('org1', 'BATCH-1', { floorCode: '1', chamberCode: 'A', rackCode: '12' } as any);

    expect(locationsService.resolveOrCreateRack).toHaveBeenCalledWith('org1', '1', 'A', '12');
    expect(repo.runInTransaction).toHaveBeenCalled();
    expect(result.locationCode).toBe('WH1-F1-CA-R12');
    expect(result.bagsMoved).toBe(2);
  });

  it('marking bags damaged frees their racks', async () => {
    repo.findBatchBagsInStorage.mockResolvedValue([{ id: 'bag1', rackId: 'rack1', weightKg: 50 }]);
    repo.update.mockResolvedValue({ id: 'bag1', status: 'DAMAGED' });
    repo.findRack.mockResolvedValue({ id: 'rack1', currentLoad: 2 });

    const result = await service.damageBatch('org1', 'BATCH-1', { bagCount: 1, note: 'wet bag' } as any);

    expect(repo.runInTransaction).toHaveBeenCalled();
    expect(locationsService.recalculateStatus).toHaveBeenCalledWith('rack1', 1, fakeTx);
    expect(result.damagedCount).toBe(1);
  });

  it('throws NotFoundException for an unknown bag', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getById('missing', 'org1')).rejects.toThrow(NotFoundException);
  });
});
