import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum GradeDto {
  PREMIUM = 'PREMIUM',
  A = 'A',
  B = 'B',
  C = 'C',
  REJECTED = 'REJECTED',
}

export class CreateBagDto {
  @IsUUID()
  farmerId: string;

  @IsUUID()
  cropId: string;

  @IsOptional()
  @IsUUID()
  bagTypeId?: string;

  // Used by the simplified receiving screen. The service resolves this fixed
  // size to a BagType record, creating the standard type when necessary.
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  bagSizeKg?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  bagCount?: number;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsEnum(GradeDto)
  grade?: GradeDto;

  @IsNumber()
  @Min(0.1)
  weightKg: number;

  @IsOptional()
  @IsUUID()
  positionId?: string;
}

export class MoveBagDto {
  @IsUUID()
  toPositionId: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AdjustBagDto {
  @IsNumber()
  weightKg: number;

  @IsString()
  note: string;
}

export class DamageBagDto {
  @IsString()
  note: string;
}

export class ListBagsQueryDto {
  @IsOptional()
  @IsUUID()
  farmerId?: string;

  @IsOptional()
  @IsUUID()
  cropId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 20;
}
