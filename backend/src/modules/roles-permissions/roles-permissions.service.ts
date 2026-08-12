import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';

@Injectable()
export class RolesPermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * A caller sees system role templates (organizationId: null, shared
   * across every org — e.g. default "Admin"/"Warehouse Manager") plus
   * whatever custom roles their own org has created. They never see
   * another org's custom roles — that was a real bug: this previously had
   * no scoping at all, so any org's admin could enumerate (and, via
   * updateRolePermissions/deleteRole below, modify or delete) every other
   * org's role definitions.
   */
  listRoles(organizationId: string) {
    return this.prisma.role.findMany({
      where: { deletedAt: null, OR: [{ organizationId: null }, { organizationId }] },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  listPermissions() {
    // Permission is the fixed platform-defined action catalog (e.g.
    // "inventory:read") — same set for every organization, so it's
    // intentionally not org-scoped, unlike Role.
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  }

  async createRole(organizationId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({ where: { organizationId, name: dto.name } });
    if (existing) throw new ConflictException('Role name already exists');
    return this.prisma.role.create({ data: { name: dto.name, organizationId } });
  }

  async updateRolePermissions(roleId: string, organizationId: string, dto: UpdateRolePermissionsDto) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, deletedAt: null, organizationId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new BadRequestException('System role permissions cannot be modified directly');
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async deleteRole(roleId: string, organizationId: string) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, deletedAt: null, organizationId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');

    const usersOnRole = await this.prisma.user.count({ where: { roleId, deletedAt: null } });
    if (usersOnRole > 0) {
      throw new BadRequestException('Cannot delete a role assigned to active users');
    }

    await this.prisma.role.update({ where: { id: roleId }, data: { deletedAt: new Date() } });
    return { message: 'Role deleted' };
  }
}
