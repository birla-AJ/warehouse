import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, ListUsersQueryDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepo: UsersRepository) {}

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

  async getById(id: string) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async create(organizationId: string, dto: CreateUserDto) {
    const existing = await this.usersRepo.findByEmailOrMobile(dto.email, dto.mobile);
    if (existing) throw new ConflictException('Email or mobile already registered');

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

  async update(id: string, dto: UpdateUserDto) {
    await this.getById(id); // ensures existence + not-deleted

    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await argon2.hash(dto.password);
      delete data.password;
    }
    if (dto.roleId) {
      data.role = { connect: { id: dto.roleId } };
      delete data.roleId;
    }

    const updated = await this.usersRepo.update(id, data);
    return this.sanitize(updated);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.usersRepo.softDelete(id);
    return { message: 'User deactivated' };
  }

  private sanitize(user: any) {
    const { passwordHash, otpCode, otpExpiresAt, ...safe } = user;
    return safe;
  }
}
