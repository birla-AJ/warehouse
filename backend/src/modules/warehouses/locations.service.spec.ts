import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { WarehousesRepository } from './warehouses.repository';

describe('LocationsService', () => {
  let service: LocationsService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      findZone: jest.fn(),
      findLevel: jest.fn(),
      createZone: jest.fn(),
      createPosition: jest.fn(),
      updatePosition: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [LocationsService, { provide: WarehousesRepository, useValue: repo }],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('throws NotFoundException when warehouse does not exist for zone creation', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.createZone('missing', { code: 'A' })).rejects.toThrow(NotFoundException);
  });

  it('wraps a unique-constraint failure as ConflictException', async () => {
    repo.findById.mockResolvedValue({ id: 'wh1' });
    repo.createZone.mockRejectedValue(new Error('unique constraint'));

    await expect(service.createZone('wh1', { code: 'A' })).rejects.toThrow(ConflictException);
  });

  it('generates a correctly formatted locationCode from the full ancestry', async () => {
    repo.findLevel.mockResolvedValue({
      id: 'level1',
      code: '4',
      rack: {
        code: '3',
        row: {
          code: '1',
          block: {
            code: '2',
            zone: {
              code: 'A',
              warehouse: { code: 'WH1' },
            },
          },
        },
      },
    });
    repo.createPosition.mockImplementation((data: any) => Promise.resolve({ id: 'pos1', ...data }));

    const result = await service.createPosition('level1', { code: '12' } as any);

    expect(result.locationCode).toBe('WH1-ZA-B2-RW1-RK3-L4-P12');
  });

  it('recalculates status to FULL when load reaches capacity', async () => {
    repo.updatePosition
      .mockResolvedValueOnce({ id: 'pos1', status: 'PARTIAL', capacity: 10 })
      .mockResolvedValueOnce({ id: 'pos1', status: 'FULL', capacity: 10, currentLoad: 10 });

    const result = await service.recalculateStatus('pos1', 10);
    expect(result.status).toBe('FULL');
  });

  it('recalculates status to EMPTY when load drops to zero', async () => {
    repo.updatePosition
      .mockResolvedValueOnce({ id: 'pos1', status: 'PARTIAL', capacity: 10 })
      .mockResolvedValueOnce({ id: 'pos1', status: 'EMPTY', capacity: 10, currentLoad: 0 });

    const result = await service.recalculateStatus('pos1', 0);
    expect(result.status).toBe('EMPTY');
  });
});
