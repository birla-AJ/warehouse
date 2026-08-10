import { ArrayNotEmpty, IsArray, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCropDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  moisturePercent?: number;

  @IsOptional()
  @IsString()
  storageType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  shelfLifeDays?: number;

  @IsOptional()
  @IsNumber()
  idealTempC?: number;

  @IsOptional()
  @IsNumber()
  idealHumidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultCharge?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedBagTypeIds?: string[];
}

export class UpdateCropDto extends PartialType(CreateCropDto) {}

export class CreateBagTypeDto {
  @IsString()
  @MinLength(1)
  label: string;

  @IsNumber()
  @Min(0.1)
  weightKg: number;
}

export class AssignBagTypesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  bagTypeIds: string[];
}
