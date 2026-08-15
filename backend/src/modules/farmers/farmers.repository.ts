import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FarmersRepository {
  constructor(private prisma: PrismaService) {}

  findMany(where: Prisma.FarmerWhereInput, skip: number, take: number) {
    return this.prisma.farmer.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  count(where: Prisma.FarmerWhereInput) {
    return this.prisma.farmer.count({ where });
  }

  findById(id: string) {
    return this.prisma.farmer.findFirst({ where: { id, deletedAt: null } });
  }

  findByMobile(mobile: string) {
    return this.prisma.farmer.findFirst({ where: { mobile, deletedAt: null } });
  }

  countByOrg(organizationId: string) {
    return this.prisma.farmer.count({ where: { organizationId, deletedAt: null } });
  }

  // Counts ALL farmers ever created for the org (including soft-deleted), so
  // sequence numbers are never reused and can't collide with a deleted farmer's code.
  countByOrgIncludingDeleted(organizationId: string) {
    return this.prisma.farmer.count({ where: { organizationId } });
  }

  create(data: Prisma.FarmerCreateInput) {
    return this.prisma.farmer.create({ data });
  }

  update(id: string, data: Prisma.FarmerUpdateInput) {
    return this.prisma.farmer.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.farmer.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}