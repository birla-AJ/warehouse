import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateFarmerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' })
  mobile: string;

  @IsOptional()
  @IsString()
  altMobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{12}$/, { message: 'Aadhaar must be 12 digits' })
  aadhaarNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}\d{4}[A-Z]$/, { message: 'Enter a valid PAN' })
  panNumber?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @IsOptional()
  @IsString()
  bankIfsc?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  nomineeName?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateFarmerDto extends PartialType(CreateFarmerDto) {}

export class ListFarmersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
