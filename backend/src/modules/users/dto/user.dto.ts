import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export enum UserStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsUUID()
  roleId: string;

  @IsOptional()
  @IsEnum(UserStatusDto)
  status?: UserStatusDto;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
