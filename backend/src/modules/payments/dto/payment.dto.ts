import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum PaymentMethodDto {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
}

export class CreatePaymentDto {
  @IsUUID()
  farmerId: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethodDto)
  method: PaymentMethodDto;

  @IsOptional()
  @IsString()
  referenceNo?: string;
}

export class RefundPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
