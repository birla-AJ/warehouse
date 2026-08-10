import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  module: string;
  action: string;
}

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declares the module/action a route requires, e.g.
 * @Permissions({ module: 'farmers', action: 'create' })
 */
export const Permissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
