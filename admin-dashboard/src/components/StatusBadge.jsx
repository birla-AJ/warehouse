import { Chip } from '@mui/material';
import { statusColorMap } from '../theme/theme';

export function StatusBadge({ status, size = 'small' }) {
  if (!status) return null;
  const color = statusColorMap[status] ?? 'default';
  const label = status.replace(/_/g, ' ');
  return <Chip label={label} color={color} size={size} variant={color === 'default' ? 'outlined' : 'filled'} />;
}
