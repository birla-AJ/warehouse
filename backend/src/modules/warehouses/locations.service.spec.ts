import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { WarehousesRepository } from './warehouses.repository';

describe('LocationsService', () => {
  let service: LocationsService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      findFloor: jest.fn(),
      findChamber: jest.fn(),
      findDefaultWarehouse: jest.fn(),
      findFloorByCode: jest.fn(),
      findChamberByCode: jest.fn(),
      findRackByCodeInChamber: jest.fn(),
      createFloor: jest.fn(),
      createChamber: jest.fn(),
      createRack: jest.fn(),
      updateRack: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [LocationsService, { provide: WarehousesRepository, useValue: repo }],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('throws NotFoundException when chamber does not exist for rack creation', async () => {
    repo.findChamber.mockResolvedValue(null);
    await expect(service.createRack('missing', { code: '12' } as any)).rejects.toThrow(NotFoundException);
  });

  it('wraps a unique-constraint failure as ConflictException', async () => {
    repo.findFloorByCode = undefined; // not exercised in this test
    repo.findChamber.mockResolvedValue({
      id: 'chamber1',
      floor: { code: '1', warehouse: { code: 'WH1' } },
    });
    repo.createRack.mockRejectedValue(new Error('unique constraint'));

    await expect(service.createRack('chamber1', { code: '12' } as any)).rejects.toThrow(ConflictException);
  });

  it('generates a correctly formatted locationCode from floor + chamber + rack codes', async () => {
    repo.findChamber.mockResolvedValue({
      id: 'chamber1',
      code: 'A',
      floor: { code: '1', warehouse: { code: 'WH1' } },
    });
    repo.createRack.mockImplementation((data: any) => Promise.resolve({ id: 'rack1', ...data }));

    const result = await service.createRack('chamber1', { code: '12' } as any);

    expect(result.locationCode).toBe('WH1-F1-CA-R12');
  });

  it('resolveOrCreateRack throws when the org has no warehouse yet', async () => {
    repo.findDefaultWarehouse.mockResolvedValue(null);
    await expect(service.resolveOrCreateRack('org1', '1', 'A', '12')).rejects.toThrow(BadRequestException);
  });

  it('resolveOrCreateRack auto-creates floor/chamber/rack when they do not exist', async () => {
    repo.findDefaultWarehouse.mockResolvedValue({ id: 'wh1', code: 'WH1' });
    repo.findFloorByCode.mockResolvedValue(null);
    repo.createFloor.mockResolvedValue({ id: 'floor1', code: '1' });
    repo.findChamberByCode.mockResolvedValue(null);
    repo.createChamber.mockResolvedValue({ id: 'chamber1', code: 'A' });
    repo.findRackByCodeInChamber.mockResolvedValue(null);
    repo.createRack.mockImplementation((data: any) => Promise.resolve({ id: 'rack1', ...data }));

    const rack = await service.resolveOrCreateRack('org1', '1', 'A', '12');

    expect(rack.locationCode).toBe('WH1-F1-CA-R12');
  });

  it('resolveOrCreateRack reuses an existing floor/chamber/rack when found', async () => {
    repo.findDefaultWarehouse.mockResolvedValue({ id: 'wh1', code: 'WH1' });
    repo.findFloorByCode.mockResolvedValue({ id: 'floor1', code: '1' });
    repo.findChamberByCode.mockResolvedValue({ id: 'chamber1', code: 'A' });
    repo.findRackByCodeInChamber.mockResolvedValue({ id: 'rack1', locationCode: 'WH1-F1-CA-R12' });

    const rack = await service.resolveOrCreateRack('org1', '1', 'A', '12');

    expect(repo.createFloor).not.toHaveBeenCalled();
    expect(repo.createChamber).not.toHaveBeenCalled();
    expect(repo.createRack).not.toHaveBeenCalled();
    expect(rack.locationCode).toBe('WH1-F1-CA-R12');
  });

  it('recalculates status to FULL when load reaches capacity', async () => {
    repo.updateRack
      .mockResolvedValueOnce({ id: 'rack1', status: 'PARTIAL', capacity: 10 })
      .mockResolvedValueOnce({ id: 'rack1', status: 'FULL', capacity: 10, currentLoad: 10 });

    const result = await service.recalculateStatus('rack1', 10);
    expect(result.status).toBe('FULL');
  });

  it('recalculates status to EMPTY when load drops to zero', async () => {
    repo.updateRack
      .mockResolvedValueOnce({ id: 'rack1', status: 'PARTIAL', capacity: 10 })
      .mockResolvedValueOnce({ id: 'rack1', status: 'EMPTY', capacity: 10, currentLoad: 0 });

    const result = await service.recalculateStatus('rack1', 0);
    expect(result.status).toBe('EMPTY');
  });
});
