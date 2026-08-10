import { Avatar } from '@mui/material';

const ROLE_COLORS = {
  SUPER_ADMIN: '#B24A3D', WAREHOUSE_OWNER: '#2B4C5C', WAREHOUSE_MANAGER: '#3E677D',
  SUPERVISOR: '#5F859A', OPERATOR: '#87A3B3', ACCOUNTANT: '#8C6221',
  SECURITY_GUARD: '#6B4A19', FARMER: '#3F8F5F', AUDITOR: '#AD7C2C', VIEWER: '#8A97A0',
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
      }}
    >
      {initials}
    </Avatar>
  );
}
