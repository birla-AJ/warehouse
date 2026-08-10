import { Box, Paper, Stack, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import WarehouseIcon from '@mui/icons-material/Warehouse';

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'radial-gradient(circle at 20% 20%, #EEF2F5 0%, #FAF7F2 60%)'
            : 'radial-gradient(circle at 20% 20%, #1B2226 0%, #141A1D 60%)',
      }}
    >
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 420 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <WarehouseIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
            AWMS
          </Typography>
        </Stack>
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
          <Outlet />
        </Paper>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          Agricultural Warehouse Management System
        </Typography>
      </Stack>
    </Box>
  );
}
