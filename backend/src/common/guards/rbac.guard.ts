import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Permissions() decorator on the route → allow (route is auth-only)
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    // A warehouse owner is the full-control administrator of their own
    // organization. Keep legacy installations usable even when the initial
    // role_permissions seed was not applied to this system role.
    if (user.roleName === 'WAREHOUSE_OWNER') return true;

    const grantedPermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: true },
    });

    const grantedSet = new Set(
      grantedPermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`),
    );

    const hasAll = required.every((p) => grantedSet.has(`${p.module}:${p.action}`));

    if (!hasAll) {
      throw new ForbiddenException(
        `Missing permission(s): ${required.map((p) => `${p.module}:${p.action}`).join(', ')}`,
      );
    }

    return true;
  }
}
