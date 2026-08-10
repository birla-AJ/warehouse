import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findById: jest.fn(),
      findByEmailOrMobile: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: repo }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('throws NotFoundException when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getById('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when email already registered', async () => {
    repo.findByEmailOrMobile.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create('org1', {
        name: 'Test',
        email: 'dup@x.com',
        password: 'password123',
        roleId: 'role1',
      } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('strips sensitive fields from returned user', async () => {
    repo.findById.mockResolvedValue({
      id: 'u1',
      name: 'Test',
      passwordHash: 'secret-hash',
      otpCode: '123456',
      otpExpiresAt: new Date(),
    });

    const result = await service.getById('u1');
    expect(result.passwordHash).toBeUndefined();
    expect(result.otpCode).toBeUndefined();
  });

  it('paginates list results', async () => {
    repo.findMany.mockResolvedValue([{ id: 'u1' }]);
    repo.count.mockResolvedValue(1);

    const result = await service.list('org1', { page: 1, limit: 20 } as any);
    expect(result.meta.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });
});
