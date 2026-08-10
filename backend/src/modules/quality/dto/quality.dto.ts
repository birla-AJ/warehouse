import { ArrayNotEmpty, IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { GradeDto } from '../../bags/dto/bag.dto';

export class CreateQualityReportDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  moisture?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  damagePercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  brokenPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rottenPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  foreignMatter?: number;

  @IsEnum(GradeDto)
  grade: GradeDto;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
