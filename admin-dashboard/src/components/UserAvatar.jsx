import { Avatar } from '@mui/material';

const ROLE_COLORS = {
  SUPER_ADMIN: '#EF4444', WAREHOUSE_OWNER: '#122F2C', WAREHOUSE_MANAGER: '#486161',
  SUPERVISOR: '#0E2521', OPERATOR: '#14B8A6', ACCOUNTANT: '#D4A017',
  SECURITY_GUARD: '#B77B1E', FARMER: '#22C55E', AUDITOR: '#2F4744', VIEWER: '#7D8C89',
};

export function UserAvatar({ name, roleName, size = 32 }) {
  const initials = (name ?? roleName ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        bgcolor: ROLE_COLORS[roleName] ?? 'secondary.main',
        fontWeight: 700,
        boxShadow: `0 0 0 2px ${ROLE_COLORS[roleName] ?? '#122F2C'}33`,
      }}
    >
      {initials}
    </Avatar>
  );
}
