import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailProvider, SmsProvider, WhatsAppProvider, PushProvider } from './providers/stub-providers';
import { NotificationChannel } from './dto/notification.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let smsProvider: any;

  beforeEach(async () => {
    prisma = { notification: { create: jest.fn((args) => Promise.resolve({ id: 'n1', ...args.data })) } };
    smsProvider = { send: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailProvider, useValue: { send: jest.fn() } },
        { provide: SmsProvider, useValue: smsProvider },
        { provide: WhatsAppProvider, useValue: { send: jest.fn() } },
        { provide: PushProvider, useValue: { send: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(NotificationsService);
  });

  it('records a SENT notification on provider success', async () => {
    smsProvider.send.mockResolvedValue({ success: true });

    const result = await service.send({
      channel: NotificationChannel.SMS,
      recipient: '9876543210',
      type: 'OTP',
      body: 'your otp is 123456',
    });

    expect(result.status).toBe('SENT');
  });

  it('records a FAILED notification when the provider reports failure, without throwing', async () => {
    smsProvider.send.mockResolvedValue({ success: false, error: 'carrier rejected' });

    const result = await service.send({
      channel: NotificationChannel.SMS,
      recipient: '9876543210',
      type: 'OTP',
      body: 'your otp is 123456',
    });

    expect(result.status).toBe('FAILED');
    expect(result.error).toBe('carrier rejected');
  });

  it('catches a thrown provider error and records FAILED instead of propagating', async () => {
    smsProvider.send.mockRejectedValue(new Error('network down'));

    const result = await service.send({
      channel: NotificationChannel.SMS,
      recipient: '9876543210',
      type: 'OTP',
      body: 'your otp is 123456',
    });

    expect(result.status).toBe('FAILED');
    expect(result.error).toBe('network down');
  });
});
