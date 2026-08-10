import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterDocumentDto {
  @IsString()
  @MinLength(2)
  type: string; // AADHAAR | PAN | INVOICE | GATE_PASS | QUALITY_REPORT | etc

  @IsString()
  fileUrl: string; // uploaded via a presigned S3 URL upstream — this endpoint just records the metadata

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsUUID()
  farmerId?: string;

  @IsOptional()
  @IsString()
  entityType?: string; // e.g. "dispatch" | "bag" | "invoice" | "weighbridge"

  @IsOptional()
  @IsUUID()
  entityId?: string;
}

export class ListDocumentsQueryDto {
  @IsOptional()
  @IsUUID()
  farmerId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  page?: number = 1;
  limit?: number = 20;
}

export class PresignUploadDto {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;
}
