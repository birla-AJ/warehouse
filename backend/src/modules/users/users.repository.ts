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

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
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

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data, include: { role: true } });
  }

  softDelete(id: string) {
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } });
  }
}
