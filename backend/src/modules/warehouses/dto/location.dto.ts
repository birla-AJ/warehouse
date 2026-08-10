import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateLocationNodeDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreatePositionDto extends CreateLocationNodeDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  capacity?: number;
}

export class UpdatePositionStatusDto {
  @IsIn(['EMPTY', 'PARTIAL', 'FULL', 'DISABLED'])
  status: 'EMPTY' | 'PARTIAL' | 'FULL' | 'DISABLED';
}
