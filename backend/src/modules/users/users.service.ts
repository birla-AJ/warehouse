import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, ListUsersQueryDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private usersRepo: UsersRepository,
    private prisma: PrismaService,
  ) {}

  async list(organizationId: string, query: ListUsersQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const where = {
      organizationId,
      deletedAt: null,
      ...(query.roleId ? { roleId: query.roleId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { mobile: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.usersRepo.findMany({ where, skip: (page - 1) * limit, take: limit }),
      this.usersRepo.count(where),
    ]);

    return {
      items: items.map(this.sanitize),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string, organizationId: string) {
    // Previously this took no organizationId at all — any org's admin
    // could fetch, edit, or deactivate any other org's user accounts by
    // ID, including changing their password via update() below. This is
    // the check every mutation in this service now goes through first.
    const user = await this.usersRepo.findById(id, organizationId);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  private async assertRoleUsable(roleId: string, organizationId: string) {
    // A role must be either a system template (organizationId: null) or
    // owned by the caller's own org — otherwise a user could be assigned
    // a role belonging to a different organization entirely.
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, deletedAt: null, OR: [{ organizationId: null }, { organizationId }] },
    });
    if (!role) throw new NotFoundException('Role not found');
  }

  async create(organizationId: string, dto: CreateUserDto) {
    const existing = await this.usersRepo.findByEmailOrMobile(dto.email, dto.mobile);
    if (existing) throw new ConflictException('Email or mobile already registered');
    await this.assertRoleUsable(dto.roleId, organizationId);

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      mobile: dto.mobile,
      passwordHash,
      status: dto.status ?? 'ACTIVE',
      organization: { connect: { id: organizationId } },
      role: { connect: { id: dto.roleId } },
    });

    return this.sanitize(user);
  }

  async update(id: string, organizationId: string, dto: UpdateUserDto) {
    await this.getById(id, organizationId); // ensures existence + ownership + not-deleted

    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await argon2.hash(dto.password);
      delete data.password;
    }
    if (dto.roleId) {
      await this.assertRoleUsable(dto.roleId, organizationId);
      data.role = { connect: { id: dto.roleId } };
      delete data.roleId;
    }

    const updated = await this.usersRepo.update(id, data);
    return this.sanitize(updated);
  }

  async remove(id: string, organizationId: string) {
    await this.getById(id, organizationId);
    await this.usersRepo.softDelete(id);
    return { message: 'User deactivated' };
  }

  private sanitize(user: any) {
    const { passwordHash, otpCode, otpExpiresAt, ...safe } = user;
    return safe;
  }
}
