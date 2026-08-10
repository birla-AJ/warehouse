import { Module } from '@nestjs/common';
import { RolesPermissionsController } from './roles-permissions.controller';
import { RolesPermissionsService } from './roles-permissions.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [RolesPermissionsController],
  providers: [RolesPermissionsService, PrismaService],
  exports: [RolesPermissionsService],
})
export class RolesPermissionsModule {}
