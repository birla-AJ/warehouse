import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateWeighbridgeEntryDto {
  @IsString()
  @MinLength(1)
  vehicleNo: string;

  @IsIn(['IN', 'OUT'])
  direction: 'IN' | 'OUT';

  @IsNumber()
  @Min(0)
  grossWeight: number;

  @IsNumber()
  @Min(0)
  tareWeight: number;

  @IsOptional()
  @IsUUID()
  farmerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
