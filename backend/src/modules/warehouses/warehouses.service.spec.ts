import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { WarehousesRepository } from './warehouses.repository';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let repo: any;

  beforeEach(async () => {
    repo = { getLayout: jest.fn(), findById: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [WarehousesService, { provide: WarehousesRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(WarehousesService);
  });

  it('throws NotFoundException for a missing warehouse layout', async () => {
    repo.getLayout.mockResolvedValue(null);
    await expect(service.getLayout('missing', 'org1')).rejects.toThrow(NotFoundException);
  });

  it('computes occupancy percent and color coding across the Floor → Chamber → Rack tree', async () => {
    repo.getLayout.mockResolvedValue({
      id: 'wh1',
      name: 'Warehouse 1',
      code: 'WH1',
      floors: [
        {
          id: 'f1',
          code: '1',
          name: null,
          chambers: [
            {
              id: 'c1',
              code: 'A',
              name: null,
              racks: [
                { id: 'rk1', code: '1', locationCode: 'WH1-F1-CA-R1', status: 'FULL', capacity: 1, currentLoad: 1 },
                { id: 'rk2', code: '2', locationCode: 'WH1-F1-CA-R2', status: 'EMPTY', capacity: 1, currentLoad: 0 },
              ],
            },
          ],
        },
      ],
    });

    const result = await service.getLayout('wh1', 'org1');
    expect(result.occupancy.totalRacks).toBe(2);
    expect(result.occupancy.occupiedRacks).toBe(1);
    expect(result.occupancy.occupancyPercent).toBe(50);
    expect(result.floors[0].chambers[0].racks[0].color).toBe('red');
    expect(result.floors[0].chambers[0].racks[1].color).toBe('green');
  });
});
