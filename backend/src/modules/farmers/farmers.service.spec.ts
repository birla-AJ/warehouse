import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { FarmersRepository } from './farmers.repository';

process.env.ENCRYPTION_KEY = 'a'.repeat(64);

describe('FarmersService', () => {
  let service: FarmersService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      countByOrg: jest.fn().mockResolvedValue(0),
      findById: jest.fn(),
      findByMobile: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [FarmersService, { provide: FarmersRepository, useValue: repo }],
    }).compile();

    service = moduleRef.get(FarmersService);
  });

  it('throws NotFoundException when farmer does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException for duplicate mobile', async () => {
    repo.findByMobile.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create('org1', { name: 'Ramesh', mobile: '9876543210' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('generates a sequential FARM- code and never persists raw Aadhaar', async () => {
    repo.findByMobile.mockResolvedValue(null);
    repo.countByOrg.mockResolvedValue(4);
    repo.create.mockImplementation((data: any) => Promise.resolve({ id: 'f1', ...data }));

    const result = await service.create('org1', {
      name: 'Ramesh',
      mobile: '9876543210',
      aadhaarNumber: '123412341234',
    } as any);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ farmerCode: 'FARM-000005' }),
    );
    const createCallArg = repo.create.mock.calls[0][0];
    expect(createCallArg.aadhaarNumberEnc).toBeDefined();
    expect(createCallArg.aadhaarNumberEnc).not.toContain('123412341234');
    expect(result.aadhaarNumberMasked).toBe('XXXXXXXX1234');
  });

  it('strips encrypted fields from list responses', async () => {
    repo.findMany.mockResolvedValue([
      { id: 'f1', name: 'Ramesh', aadhaarNumberEnc: 'enc-value', bankAccountNoEnc: 'enc-bank' },
    ]);
    repo.count.mockResolvedValue(1);

    const result = await service.list('org1', {} as any);
    expect(result.items[0].aadhaarNumberEnc).toBeUndefined();
    expect(result.items[0].bankAccountNoEnc).toBeUndefined();
  });
});
