import { useAppSelector } from '../hooks/redux';

/**
 * The backend is the real enforcement point (RbacGuard on every route) —
 * this is UI-layer politeness so people don't see buttons for actions
 * they'll just get a 403 on. Permission list comes from
 * GET /roles (Phase 1) cached into Redux on login; until that's wired,
 * this defaults to showing everything (fail-open on the UI, backend still
 * fails closed).
 */
export function PermissionGate({ module, action, children, fallback = null }) {
  const permissions = useAppSelector((s) => s.auth.permissions);

  if (!permissions) return children; // not loaded yet — don't hide, backend still enforces
  const allowed = permissions.some((p) => p.module === module && p.action === action);
  return allowed ? children : fallback;
}
