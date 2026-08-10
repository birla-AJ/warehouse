import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CropsService } from './crops.service';
import { PrismaService } from '../../database/prisma.service';

describe('CropsService', () => {
  let service: CropsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      crop: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      bagType: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
      cropBagType: { deleteMany: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CropsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CropsService);
  });

  it('throws ConflictException for duplicate crop name', async () => {
    prisma.crop.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.create({ name: 'Potato' } as any)).rejects.toThrow(ConflictException);
  });

  it('throws NotFoundException for missing crop', async () => {
    prisma.crop.findFirst.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException for duplicate bag type label', async () => {
    prisma.bagType.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.createBagType({ label: '50 KG', weightKg: 50 })).rejects.toThrow(
      ConflictException,
    );
  });
});
