import { Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export function PageHeader({ title, breadcrumbs = [], actions }) {
  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}>
          {breadcrumbs.map((b, i) =>
            b.to ? (
              <Link key={i} component={RouterLink} to={b.to} underline="hover" color="text.secondary" variant="body2">
                {b.label}
              </Link>
            ) : (
              <Typography key={i} variant="body2" color="text.secondary">
                {b.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
        <Typography variant="h5" fontWeight={800}>
          {title}
        </Typography>
        {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
      </Stack>
    </Stack>
  );
}
