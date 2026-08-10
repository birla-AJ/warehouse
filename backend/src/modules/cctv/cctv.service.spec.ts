import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CctvService } from './cctv.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

process.env.ENCRYPTION_KEY = 'b'.repeat(64);

describe('CctvService', () => {
  let service: CctvService;
  let prisma: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      camera: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };
    notifications = { send: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CctvService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(CctvService);
  });

  it('throws NotFoundException for an unknown camera', async () => {
    prisma.camera.findFirst.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('never returns passwordEnc from create/list/getById', async () => {
    prisma.camera.create.mockResolvedValue({ id: 'cam1', name: 'Gate Cam', passwordEnc: 'enc-value' });
    const created = await service.create({ warehouseId: 'wh1', name: 'Gate Cam', rtspUrl: 'rtsp://x', password: 'secret' } as any);
    expect(created.passwordEnc).toBeUndefined();

    prisma.camera.findFirst.mockResolvedValue({ id: 'cam1', name: 'Gate Cam', passwordEnc: 'enc-value' });
    const fetched = await service.getById('cam1');
    expect(fetched.passwordEnc).toBeUndefined();
  });

  it('getStreamInfo decrypts the password for server-side use', async () => {
    let capturedData: any;
    prisma.camera.create.mockImplementation((args: any) => {
      capturedData = args.data;
      return Promise.resolve({ id: 'cam1', ...args.data });
    });
    await service.create({
      warehouseId: 'wh1',
      name: 'Gate Cam',
      rtspUrl: 'rtsp://x',
      password: 'secret123',
    } as any);

    prisma.camera.findFirst.mockResolvedValue({ id: 'cam1', name: 'Gate Cam', rtspUrl: 'rtsp://x', passwordEnc: capturedData.passwordEnc, status: 'ONLINE' });

    const stream = await service.getStreamInfo('cam1');
    expect(stream.password).toBe('secret123');
  });

  it('sends a CAMERA_OFFLINE alert only on transition into OFFLINE', async () => {
    prisma.camera.findFirst.mockResolvedValue({ id: 'cam1', name: 'Gate Cam', warehouseId: 'wh1', assignedTo: 'Entry Gate', status: 'ONLINE' });
    prisma.camera.update.mockResolvedValue({ id: 'cam1', status: 'OFFLINE' });

    await service.reportHealth('cam1', { status: 'OFFLINE' } as any);

    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CAMERA_OFFLINE' }),
    );
  });

  it('does not re-alert if the camera was already OFFLINE', async () => {
    prisma.camera.findFirst.mockResolvedValue({ id: 'cam1', name: 'Gate Cam', warehouseId: 'wh1', status: 'OFFLINE' });
    prisma.camera.update.mockResolvedValue({ id: 'cam1', status: 'OFFLINE' });

    await service.reportHealth('cam1', { status: 'OFFLINE' } as any);

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('motionAlert sends a CAMERA_MOTION notification', async () => {
    prisma.camera.findFirst.mockResolvedValue({ id: 'cam1', name: 'Gate Cam', warehouseId: 'wh1', assignedTo: 'Entry Gate' });

    await service.motionAlert('cam1', { note: 'person detected' } as any);

    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CAMERA_MOTION', body: expect.stringContaining('person detected') }),
    );
  });
});
