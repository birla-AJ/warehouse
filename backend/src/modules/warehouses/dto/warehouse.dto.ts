import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateWarehouseDto {
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
  @Min(0)
  totalCapacity?: number;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}
