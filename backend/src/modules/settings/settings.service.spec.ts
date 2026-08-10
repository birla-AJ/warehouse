import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaService } from '../../database/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { setting: { findUnique: jest.fn(), upsert: jest.fn(), findMany: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(SettingsService);
  });

  it('throws NotFoundException for a key that has never been set', async () => {
    prisma.setting.findUnique.mockResolvedValue(null);
    await expect(service.get('org1', 'theme')).rejects.toThrow(NotFoundException);
  });

  it('upserts by (organizationId, key)', async () => {
    prisma.setting.upsert.mockResolvedValue({ key: 'theme', value: { mode: 'dark' } });

    await service.upsert('org1', 'theme', { mode: 'dark' });

    expect(prisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId_key: { organizationId: 'org1', key: 'theme' } },
      }),
    );
  });
});
