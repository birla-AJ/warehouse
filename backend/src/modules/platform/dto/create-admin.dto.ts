import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class AdminWarehouseDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(1)
  code: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsIn(['bags', 'tonnes', 'kg', 'custom'])
  capacityUnit?: string;

  @IsOptional()
  @IsNumber()
  totalCapacity?: number;
}

/**
 * A super admin creates an Admin, which — per the business model here — is
 * always a warehouse owner. Creating one spins up a brand new Organization
 * (the tenant boundary) plus that org's first Warehouse (with full location
 * detail) plus the WAREHOUSE_OWNER user in a single transaction, so the
 * admin can log in immediately and already has a warehouse to run.
 */
export class CreateAdminDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  organizationName?: string; // defaults to "<name>'s Warehouse" if omitted

  @ValidateNested()
  @Type(() => AdminWarehouseDto)
  warehouse: AdminWarehouseDto;
}
