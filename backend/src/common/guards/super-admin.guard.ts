import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Platform-level guard: only the SUPER_ADMIN system role may pass.
 * Unlike RbacGuard (which checks per-module permissions within a user's own
 * organization), this guard gates the platform module, which acts *across*
 * organizations — creating/removing warehouse-owner admins and their orgs.
 * That reach must never be exposed to a regular org-scoped permission.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.roleName !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Super admin access required');
    }
    return true;
  }
}
