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
  @IsIn(['bags', 'tonnes', 'kg', 'custom'])
  capacityUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCapacity?: number;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}
