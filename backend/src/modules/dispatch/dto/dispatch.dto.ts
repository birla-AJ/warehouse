import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, IsUUID, Length, Matches, MinLength } from 'class-validator';

export class CreateDispatchDto {
  @IsUUID()
  farmerId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  bagIds: string[];

  @IsString()
  @MinLength(1)
  vehicleNo: string;

  @IsString()
  @MinLength(2)
  driverName: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' })
  driverMobile: string;

  @IsIn(['PARTIAL', 'FULL'])
  dispatchType: 'PARTIAL' | 'FULL';
}

export class VerifyDispatchOtpDto {
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scannedBagCodes?: string[];
}
