import { IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @ValidateIf((o) => !o.mobile)
  @IsNotEmpty({ message: 'Either email or mobile is required' })
  @IsString()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Either email or mobile is required' })
  @IsString()
  mobile?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
