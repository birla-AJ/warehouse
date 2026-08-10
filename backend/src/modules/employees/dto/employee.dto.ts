import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  shift?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsDateString()
  joinDate?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}

export class MarkAttendanceDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  date: string;

  @IsIn(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'])
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

  @IsOptional()
  @IsString()
  note?: string;
}

export class RequestLeaveDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class DecideLeaveDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
}
