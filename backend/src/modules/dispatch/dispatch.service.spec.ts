import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DispatchService } from './dispatch.service';
import { PrismaService } from '../../database/prisma.service';
import { BagsService } from '../bags/bags.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('DispatchService', () => {
  let service: DispatchService;
  let prisma: any;
  let bagsService: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      bag: { findMany: jest.fn() },
      dispatch: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(0), findMany: jest.fn() },
    };
    bagsService = { reserve: jest.fn(), unreserve: jest.fn(), markDispatched: jest.fn() };
    notifications = { send: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DispatchService,
        { provide: PrismaService, useValue: prisma },
        { provide: BagsService, useValue: bagsService },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(DispatchService);
  });

  it('throws NotFoundException when a bag id does not exist', async () => {
    prisma.bag.findMany.mockResolvedValue([{ id: 'bag1', farmerId: 'f1', status: 'IN_STORAGE' }]);

    await expect(
      service.create({ farmerId: 'f1', bagIds: ['bag1', 'bag2'], vehicleNo: 'MP09AB1234', driverName: 'Ramesh', driverMobile: '9876543210', dispatchType: 'FULL' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects bags that belong to a different farmer', async () => {
    prisma.bag.findMany.mockResolvedValue([{ id: 'bag1', farmerId: 'other', status: 'IN_STORAGE' }]);

    await expect(
      service.create({ farmerId: 'f1', bagIds: ['bag1'], vehicleNo: 'MP09AB1234', driverName: 'Ramesh', driverMobile: '9876543210', dispatchType: 'FULL' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects bags that are not IN_STORAGE', async () => {
    prisma.bag.findMany.mockResolvedValue([{ id: 'bag1', farmerId: 'f1', status: 'DISPATCHED' }]);

    await expect(
      service.create({ farmerId: 'f1', bagIds: ['bag1'], vehicleNo: 'MP09AB1234', driverName: 'Ramesh', driverMobile: '9876543210', dispatchType: 'FULL' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('reserves each bag, creates the dispatch, and sends the OTP notification', async () => {
    prisma.bag.findMany.mockResolvedValue([{ id: 'bag1', farmerId: 'f1', status: 'IN_STORAGE' }]);
    prisma.dispatch.create.mockResolvedValue({ id: 'd1', otpCodeHash: 'hash', bags: [], farmer: { mobile: '9876543210' } });

    await service.create({ farmerId: 'f1', bagIds: ['bag1'], vehicleNo: 'MP09AB1234', driverName: 'Ramesh', driverMobile: '9876543210', dispatchType: 'FULL' } as any);

    expect(bagsService.reserve).toHaveBeenCalledWith('bag1');
    expect(prisma.dispatch.create).toHaveBeenCalled();
    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'SMS', recipient: '9876543210', type: 'DISPATCH_OTP' }),
    );
  });

  it('rejects verifying OTP on a non-PENDING dispatch', async () => {
    prisma.dispatch.findUnique.mockResolvedValue({ id: 'd1', status: 'COMPLETED', bags: [] });

    await expect(service.verifyOtp('d1', { otp: '123456' } as any)).rejects.toThrow(BadRequestException);
  });

  it('rejects an expired OTP', async () => {
    prisma.dispatch.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'PENDING',
      otpCodeHash: 'hash',
      otpExpiresAt: new Date(Date.now() - 1000),
      bags: [],
    });

    await expect(service.verifyOtp('d1', { otp: '123456' } as any)).rejects.toThrow(BadRequestException);
  });

  it('marks all bags dispatched and completes the dispatch on valid OTP', async () => {
    const otp = '123456';
    const otpCodeHash = await argon2.hash(otp);
    prisma.dispatch.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'PENDING',
      otpCodeHash,
      otpExpiresAt: new Date(Date.now() + 60000),
      dispatchNumber: 'DSP-20260724-00001',
      bags: [{ bagId: 'bag1' }, { bagId: 'bag2' }],
    });
    prisma.dispatch.update.mockResolvedValue({ id: 'd1', status: 'COMPLETED' });

    await service.verifyOtp('d1', { otp } as any);

    expect(bagsService.markDispatched).toHaveBeenCalledWith('bag1', undefined);
    expect(bagsService.markDispatched).toHaveBeenCalledWith('bag2', undefined);
    expect(prisma.dispatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });

  it('rejects gate release when a bag was not scanned', async () => {
    const otp = '123456';
    const otpCodeHash = await argon2.hash(otp);
    prisma.dispatch.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'PENDING',
      otpCodeHash,
      otpExpiresAt: new Date(Date.now() + 60000),
      dispatchNumber: 'DSP-20260724-00001',
      bags: [{ bagId: 'bag1' }, { bagId: 'bag2' }],
    });
    prisma.bag.findMany.mockResolvedValue([{ id: 'bag1', bagCode: 'BAG-1' }]); // bag2 not scanned

    await expect(
      service.verifyOtp('d1', { otp, scannedBagCodes: ['QR-BAG1'] } as any),
    ).rejects.toThrow(BadRequestException);
    expect(bagsService.markDispatched).not.toHaveBeenCalled();
  });

  it('allows gate release when every bag was scanned', async () => {
    const otp = '123456';
    const otpCodeHash = await argon2.hash(otp);
    prisma.dispatch.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'PENDING',
      otpCodeHash,
      otpExpiresAt: new Date(Date.now() + 60000),
      dispatchNumber: 'DSP-20260724-00001',
      bags: [{ bagId: 'bag1' }],
    });
    prisma.bag.findMany.mockResolvedValue([{ id: 'bag1', bagCode: 'BAG-1' }]);
    prisma.dispatch.update.mockResolvedValue({ id: 'd1', status: 'COMPLETED' });

    await service.verifyOtp('d1', { otp, scannedBagCodes: ['QR-BAG1'] } as any);

    expect(bagsService.markDispatched).toHaveBeenCalledWith('bag1', undefined);
  });

  it('unreserves bags on cancel', async () => {
    prisma.dispatch.findUnique.mockResolvedValue({ id: 'd1', status: 'PENDING', bags: [{ bagId: 'bag1' }] });
    prisma.dispatch.update.mockResolvedValue({ id: 'd1', status: 'CANCELLED' });

    await service.cancel('d1');

    expect(bagsService.unreserve).toHaveBeenCalledWith('bag1');
  });

  it('rejects cancelling a non-PENDING dispatch', async () => {
    prisma.dispatch.findUnique.mockResolvedValue({ id: 'd1', status: 'COMPLETED', bags: [] });
    await expect(service.cancel('d1')).rejects.toThrow(BadRequestException);
  });
});
