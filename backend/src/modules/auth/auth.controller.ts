import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Ip, Param, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, ChangePasswordDto } from './dto/password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email or mobile + password' })
  login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.login(dto, {
      deviceName: dto.deviceName,
      userAgent: req.headers['user-agent'],
      ipAddress: ip,
    });
  }

  @Public()
  @Post('login/otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request an OTP for mobile login' })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Post('login/otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and issue session tokens' })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.verifyOtp(dto, {
      deviceName: dto.deviceName,
      userAgent: req.headers['user-agent'],
      ipAddress: ip,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token for a new access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password while logged in (requires current password)' })
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Get('permissions')
  @ApiOperation({ summary: "Get the current user's effective permissions" })
  getMyPermissions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMyPermissions(user.id);
  }

  @Get('devices')
  @ApiOperation({ summary: 'List active devices/sessions for the current user' })
  listDevices(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listDevices(user.id);
  }

  @Delete('devices/:id')
  @ApiOperation({ summary: 'Revoke a device session' })
  revokeDevice(@CurrentUser() user: AuthenticatedUser, @Param('id') deviceId: string) {
    return this.authService.revokeDevice(user.id, deviceId);
  }
}
