import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateBillingRuleDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsUUID()
  cropId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ratePerBagPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ratePerKgPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  handlingCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loadingCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unloadingCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  packingCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cleaningCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortingCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gstPercent?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class GenerateInvoicesDto {
  @IsDateString()
  periodFrom: string;

  @IsDateString()
  periodTo: string;

  @IsOptional()
  @IsUUID()
  farmerId?: string; // generate for a single farmer instead of the whole org

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty?: number;
}
