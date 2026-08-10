import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' })
  mobile: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' })
  mobile: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;

  @IsString()
  deviceName?: string;
}
