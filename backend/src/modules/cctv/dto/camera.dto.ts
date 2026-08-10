import { IsIn, IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/swagger';

export class CreateCameraDto {
  @IsUUID()
  warehouseId: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsIn(['FIXED', 'PTZ', 'DOME'])
  cameraType?: string;

  @IsString()
  rtspUrl: string;

  @IsOptional()
  @IsObject()
  onvifDetails?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class UpdateCameraDto extends PartialType(OmitType(CreateCameraDto, ['warehouseId'] as const)) {}

export class UpdateCameraHealthDto {
  @IsIn(['ONLINE', 'OFFLINE', 'MAINTENANCE'])
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
}

export class MotionAlertDto {
  @IsOptional()
  @IsString()
  note?: string;
}
