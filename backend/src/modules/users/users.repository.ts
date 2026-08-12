import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  findMany(params: { where: Prisma.UserWhereInput; skip: number; take: number }) {
    return this.prisma.user.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: { role: true },
    });
  }

  count(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where });
  }

  findById(id: string, organizationId: string) {
    return this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { role: true },
    });
  }

  findByEmailOrMobile(email?: string, mobile?: string) {
    return this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [email ? { email } : undefined, mobile ? { mobile } : undefined].filter(Boolean) as any,
      },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data, include: { role: true } });
  }

  // NOTE: `where: { id }` only — Prisma's single-record update/delete only
  // accepts unique fields in `where` (organizationId isn't one). The
  // organization check happens in the service layer via findById() BEFORE
  // this is ever called — see UsersService.update()/remove() below, same
  // check-then-mutate-by-id pattern used across bags/dispatch/etc.
  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data, include: { role: true } });
  }

  softDelete(id: string) {
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } });
  }
}
