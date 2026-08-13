import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';

@Injectable()
export class PlatformService {
  constructor(private prisma: PrismaService) {}

  /**
   * Every "Admin" in this system owns exactly one warehouse and exactly one
   * organization (the tenant boundary all their staff/farmers/inventory
   * live under). Super admin onboarding therefore creates all three —
   * Organization, Warehouse (with full location), WAREHOUSE_OWNER user —
   * atomically, so the admin can log straight into a working dashboard.
   */
  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [dto.email ? { email: dto.email } : undefined, dto.mobile ? { mobile: dto.mobile } : undefined].filter(
          Boolean,
        ) as any,
      },
    });
    if (existing) throw new ConflictException('Email or mobile already registered');

    const ownerRole = await this.prisma.role.findFirst({
      where: { name: 'WAREHOUSE_OWNER', isSystem: true, organizationId: null },
    });
    if (!ownerRole) {
      throw new NotFoundException('WAREHOUSE_OWNER system role is missing — re-run the seed script');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName?.trim() || `${dto.name}'s Warehouse` },
      });

      const existingCode = await tx.warehouse.findFirst({
        where: { organizationId: organization.id, code: dto.warehouse.code },
      });
      if (existingCode) throw new ConflictException('Warehouse code already in use');

      const warehouse = await tx.warehouse.create({
        data: {
          organizationId: organization.id,
          name: dto.warehouse.name,
          code: dto.warehouse.code,
          address: dto.warehouse.address,
          city: dto.warehouse.city,
          state: dto.warehouse.state,
          pincode: dto.warehouse.pincode,
          latitude: dto.warehouse.latitude,
          longitude: dto.warehouse.longitude,
          capacityUnit: dto.warehouse.capacityUnit ?? 'bags',
          totalCapacity: dto.warehouse.totalCapacity ?? 0,
        },
      });

      const admin = await tx.user.create({
        data: {
          organizationId: organization.id,
          name: dto.name,
          email: dto.email,
          mobile: dto.mobile,
          passwordHash,
          roleId: ownerRole.id,
          status: 'ACTIVE',
        },
        include: { role: true },
      });

      const { passwordHash: _omit, otpCode, otpExpiresAt, ...safeAdmin } = admin;
      return { admin: safeAdmin, organization, warehouse };
    });
  }

  /** Every admin (WAREHOUSE_OWNER) across every organization, newest first. */
  async listAdmins(page = 1, limit = 20, search?: string) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));

    const where = {
      deletedAt: null,
      role: { name: 'WAREHOUSE_OWNER' as const },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { mobile: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          role: true,
          organization: { include: { warehouses: { where: { deletedAt: null }, take: 1 } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(({ passwordHash, otpCode, otpExpiresAt, ...safe }) => safe),
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  async getAdmin(id: string) {
    const admin = await this.prisma.user.findFirst({
      where: { id, deletedAt: null, role: { name: 'WAREHOUSE_OWNER' } },
      include: { role: true, organization: { include: { warehouses: { where: { deletedAt: null } } } } },
    });
    if (!admin) throw new NotFoundException('Admin not found');
    const { passwordHash, otpCode, otpExpiresAt, ...safe } = admin;
    return safe;
  }

  async updateStatus(id: string, dto: UpdateAdminStatusDto) {
    await this.getAdmin(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      include: { role: true },
    });
    const { passwordHash, otpCode, otpExpiresAt, ...safe } = updated;
    return safe;
  }

  /** Soft-delete the admin (their org/warehouse/data stays intact — only login access is removed). */
  async removeAdmin(id: string) {
    await this.getAdmin(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
    return { message: 'Admin removed' };
  }

  /** Platform-wide stats for the super admin's dashboard graphs. */
  async getStats() {
    const [totalAdmins, activeAdmins, suspendedAdmins, totalWarehouses, totalFarmers, totalOrganizations, admins] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null, role: { name: 'WAREHOUSE_OWNER' } } }),
        this.prisma.user.count({
          where: { deletedAt: null, status: 'ACTIVE', role: { name: 'WAREHOUSE_OWNER' } },
        }),
        this.prisma.user.count({
          where: { deletedAt: null, status: 'SUSPENDED', role: { name: 'WAREHOUSE_OWNER' } },
        }),
        this.prisma.warehouse.count({ where: { deletedAt: null } }),
        this.prisma.farmer.count({ where: { deletedAt: null } }),
        this.prisma.organization.count({ where: { deletedAt: null } }),
        this.prisma.user.findMany({
          where: { deletedAt: null, role: { name: 'WAREHOUSE_OWNER' } },
          select: { createdAt: true },
        }),
      ]);

    // Admins onboarded per month for the last 6 months — feeds the growth chart.
    const monthly: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
    }
    for (const a of admins) {
      const key = `${a.createdAt.getFullYear()}-${String(a.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthly) monthly[key] += 1;
    }

    return {
      totalAdmins,
      activeAdmins,
      suspendedAdmins,
      totalWarehouses,
      totalFarmers,
      totalOrganizations,
      adminsPerMonth: Object.entries(monthly).map(([month, count]) => ({ month, count })),
    };
  }
}
