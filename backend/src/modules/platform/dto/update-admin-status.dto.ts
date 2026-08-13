import { IsIn } from 'class-validator';

export class UpdateAdminStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status: 'ACTIVE' | 'SUSPENDED';
}
