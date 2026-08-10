import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/password.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/dto/notification.dto';

interface DeviceContext {
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
}

const OTP_TTL_MINUTES = 5;
const REFRESH_TOKEN_TTL_DAYS = 30;
const ACCESS_TOKEN_TTL = '15m';
const RESET_TOKEN_TTL_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  async login(dto: LoginDto, ctx: DeviceContext) {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [dto.email ? { email: dto.email } : undefined, dto.mobile ? { mobile: dto.mobile } : undefined].filter(
          Boolean,
        ) as any,
      },
      include: { role: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return this.issueSession(user.id, user.organizationId, user.roleId, user.role.name, ctx);
  }

  async requestOtp(dto: RequestOtpDto) {
    const user = await this.prisma.user.findFirst({
      where: { mobile: dto.mobile, deletedAt: null },
    });
    if (!user) throw new BadRequestException('No account found for this mobile number');

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: await argon2.hash(otpCode), otpExpiresAt },
    });

    await this.notifications.send({
      channel: NotificationChannel.SMS,
      recipient: user.mobile!,
      type: 'OTP',
      body: `Your AWMS login OTP is ${otpCode}. Valid for ${OTP_TTL_MINUTES} minutes.`,
      userId: user.id,
    });

    return { message: 'OTP sent', expiresInMinutes: OTP_TTL_MINUTES };
  }

  async verifyOtp(dto: VerifyOtpDto, ctx: DeviceContext) {
    const user = await this.prisma.user.findFirst({
      where: { mobile: dto.mobile, deletedAt: null },
      include: { role: true },
    });

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException('OTP not requested or already used');
    }
    if (user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    const otpValid = await argon2.verify(user.otpCode, dto.otp);
    if (!otpValid) throw new UnauthorizedException('Invalid OTP');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null },
    });

    return this.issueSession(user.id, user.organizationId, user.roleId, user.role.name, ctx);
  }

  async refresh(refreshTokenRaw: string) {
    const tokenHash = this.hashToken(refreshTokenRaw);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = this.signAccessToken(stored.user.id);
    const newRefreshToken = await this.createRefreshToken(stored.user.id, stored.deviceId);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    // Always return a generic response — never reveal whether an email exists
    if (!user) return { message: 'If the account exists, a reset link has been sent' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${this.config.get<string>('APP_URL') ?? ''}/reset-password?token=${resetToken}`;
    await this.notifications.send({
      channel: NotificationChannel.EMAIL,
      recipient: user.email!,
      type: 'PASSWORD_RESET',
      subject: 'Reset your AWMS password',
      body: `Reset your password using this link (valid ${RESET_TOKEN_TTL_MINUTES} minutes): ${resetUrl}`,
      userId: user.id,
    });

    return { message: 'If the account exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Password reset token invalid or expired');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: newPasswordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Revoke all existing sessions — a password reset should not leave old refresh tokens valid
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully. Please log in again.' };
  }

  async listDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({ where: { id: deviceId, userId } });
    if (!device) throw new BadRequestException('Device not found');

    await this.prisma.refreshToken.updateMany({
      where: { deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Device sessions revoked' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newPasswordHash } }),
      // Revoke every other session — only this request's flow continues, everywhere else re-logs in
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password changed. Other sessions have been signed out.' };
  }

  async getMyPermissions(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new UnauthorizedException('User not found');

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => ({ module: rp.permission.module, action: rp.permission.action }));
  }

  // ── internal helpers ──────────────────────────────────────

  private async issueSession(
    userId: string,
    organizationId: string,
    roleId: string,
    roleName: string,
    ctx: DeviceContext,
  ) {
    const device = await this.prisma.device.create({
      data: {
        userId,
        deviceName: ctx.deviceName,
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
      },
    });

    const accessToken = this.signAccessToken(userId);
    const refreshToken = await this.createRefreshToken(userId, device.id);

    return {
      accessToken,
      refreshToken,
      user: { id: userId, organizationId, roleId, roleName },
    };
  }

  private signAccessToken(userId: string) {
    return this.jwt.sign(
      { sub: userId },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );
  }

  private async createRefreshToken(userId: string, deviceId: string) {
    const raw = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, deviceId, tokenHash, expiresAt },
    });

    return raw;
  }

  private hashToken(raw: string) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
