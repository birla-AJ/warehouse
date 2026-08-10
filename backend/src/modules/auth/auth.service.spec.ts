import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn(), update: jest.fn() },
      device: { create: jest.fn().mockResolvedValue({ id: 'device-1' }) },
      refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    notifications = { send: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') } },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret'), get: jest.fn().mockReturnValue('http://localhost:5173') },
        },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('rejects login for unknown user', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@x.com', password: 'password123' } as any, {}),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects login for inactive user', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      status: 'SUSPENDED',
      passwordHash: 'hash',
      role: { id: 'r1', name: 'VIEWER' },
    });

    await expect(
      service.login({ email: 'x@x.com', password: 'password123' } as any, {}),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects login for wrong password', async () => {
    const passwordHash = await argon2.hash('correct-password');
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      status: 'ACTIVE',
      passwordHash,
      organizationId: 'org1',
      roleId: 'r1',
      role: { id: 'r1', name: 'VIEWER' },
    });

    await expect(
      service.login({ email: 'x@x.com', password: 'wrong-password' } as any, {}),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('issues tokens for valid credentials', async () => {
    const passwordHash = await argon2.hash('correct-password');
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      status: 'ACTIVE',
      passwordHash,
      organizationId: 'org1',
      roleId: 'r1',
      role: { id: 'r1', name: 'VIEWER' },
    });

    const result = await service.login(
      { email: 'x@x.com', password: 'correct-password' } as any,
      { deviceName: 'chrome', ipAddress: '127.0.0.1' },
    );

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.refreshToken).toBeDefined();
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('sends the OTP via SMS notification on requestOtp', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', mobile: '9876543210' });
    prisma.user.update.mockResolvedValue({});

    await service.requestOtp({ mobile: '9876543210' } as any);

    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'SMS', recipient: '9876543210', type: 'OTP' }),
    );
  });

  it('forgotPassword returns a generic message even for an unknown email (no enumeration)', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    const result = await service.forgotPassword({ email: 'nobody@x.com' } as any);
    expect(result.message).toMatch(/if the account exists/i);
    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('forgotPassword creates a hashed reset token and emails a reset link', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', email: 'x@x.com' });
    prisma.passwordResetToken.create.mockResolvedValue({});

    await service.forgotPassword({ email: 'x@x.com' } as any);

    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'EMAIL', recipient: 'x@x.com', type: 'PASSWORD_RESET' }),
    );
  });

  it('resetPassword rejects an unknown or expired token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(service.resetPassword({ token: 'bad', newPassword: 'NewPass1!' } as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('resetPassword rejects an already-used token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'rt1',
      userId: 'u1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
    });
    await expect(service.resetPassword({ token: 'used', newPassword: 'NewPass1!' } as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('resetPassword updates the password and revokes existing sessions on success', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'rt1',
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });

    const result = await service.resetPassword({ token: 'good', newPassword: 'NewPass1!' } as any);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.message).toMatch(/reset successfully/i);
  });

  it('changePassword rejects an incorrect current password', async () => {
    const passwordHash = await argon2.hash('correct-current');
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', passwordHash });

    await expect(
      service.changePassword('u1', { currentPassword: 'wrong', newPassword: 'NewPass1!' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('changePassword succeeds and revokes other sessions', async () => {
    const passwordHash = await argon2.hash('correct-current');
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', passwordHash });

    const result = await service.changePassword('u1', {
      currentPassword: 'correct-current',
      newPassword: 'NewPass1!',
    } as any);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.message).toMatch(/password changed/i);
  });

  it('getMyPermissions maps role permissions to module/action pairs', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', roleId: 'r1' });
    prisma.rolePermission = {
      findMany: jest.fn().mockResolvedValue([
        { permission: { module: 'farmers', action: 'read' } },
        { permission: { module: 'farmers', action: 'create' } },
      ]),
    };

    const result = await service.getMyPermissions('u1');
    expect(result).toEqual([
      { module: 'farmers', action: 'read' },
      { module: 'farmers', action: 'create' },
    ]);
  });
});
