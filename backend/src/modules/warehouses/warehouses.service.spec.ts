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
    await expect(service.getLayout('missing')).rejects.toThrow(NotFoundException);
  });

  it('computes occupancy percent and color coding across the nested tree', async () => {
    repo.getLayout.mockResolvedValue({
      id: 'wh1',
      name: 'Warehouse 1',
      code: 'WH1',
      zones: [
        {
          id: 'z1',
          code: 'A',
          name: null,
          blocks: [
            {
              id: 'b1',
              code: '1',
              name: null,
              rows: [
                {
                  id: 'r1',
                  code: '1',
                  name: null,
                  racks: [
                    {
                      id: 'rk1',
                      code: '1',
                      name: null,
                      levels: [
                        {
                          id: 'l1',
                          code: '1',
                          name: null,
                          positions: [
                            { id: 'p1', code: '1', locationCode: 'WH1-ZA-B1-RW1-RK1-L1-P1', status: 'FULL', capacity: 1, currentLoad: 1 },
                            { id: 'p2', code: '2', locationCode: 'WH1-ZA-B1-RW1-RK1-L1-P2', status: 'EMPTY', capacity: 1, currentLoad: 0 },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = await service.getLayout('wh1');
    expect(result.occupancy.totalPositions).toBe(2);
    expect(result.occupancy.occupiedPositions).toBe(1);
    expect(result.occupancy.occupancyPercent).toBe(50);
    expect(result.zones[0].blocks[0].rows[0].racks[0].levels[0].positions[0].color).toBe('red');
    expect(result.zones[0].blocks[0].rows[0].racks[0].levels[0].positions[1].color).toBe('green');
  });
});
