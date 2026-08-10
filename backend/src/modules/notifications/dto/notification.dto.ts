import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
}

export class SendTestNotificationDto {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  recipient: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body: string;
}

export class ListNotificationsQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  farmerId?: string;

  @IsOptional()
  @IsIn(['PENDING', 'SENT', 'FAILED'])
  status?: string;

  page?: number = 1;
  limit?: number = 20;
}
