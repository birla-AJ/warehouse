import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class AuditLogQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  page?: number = 1;
  limit?: number = 50;
}
