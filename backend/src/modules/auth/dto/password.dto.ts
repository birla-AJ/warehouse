import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'Password must be at least 8 characters and include upper, lower, number, and special character',
  })
  newPassword: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'Password must be at least 8 characters and include upper, lower, number, and special character',
  })
  newPassword: string;
}
