import { Box, Paper, Stack, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AwmsLogo } from '../assets/AwmsLogo';

function Blob({ top, left, right, bottom, size, gradient, animation }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top, left, right, bottom,
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradient,
        filter: 'blur(70px)',
        opacity: 0.55,
        animation,
        pointerEvents: 'none',
      }}
    />
  );
}

export function AuthLayout() {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(160deg,#FAF8F3 0%,#F1F5F4 45%,#EEF4F2 100%)'
            : 'linear-gradient(160deg,#0B1F1A 0%,#0E2521 45%,#0B1F1A 100%)',
      }}
    >
      <Blob
        top="-10%"
        left="-8%"
        size="420px"
        gradient="radial-gradient(circle, #8FBFB6, transparent 70%)"
        animation="awmsFloat 12s ease-in-out infinite"
      />
      <Blob
        bottom="-14%"
        right="-10%"
        size="480px"
        gradient="radial-gradient(circle, #486161, transparent 70%)"
        animation="awmsFloatReverse 14s ease-in-out infinite"
      />
      <Blob
        top="30%"
        right="12%"
        size="220px"
        gradient="radial-gradient(circle, #D4A017, transparent 70%)"
        animation="awmsFloat 10s ease-in-out infinite"
      />

      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
        <LanguageSwitcher />
      </Box>

      <Stack spacing={3} sx={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }} className="awms-fade-up">
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <AwmsLogo size={48} animated textSx={{ fontSize: '1.6rem' }} />
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            background: (theme) =>
              theme.palette.mode === 'light' ? 'rgba(255,255,255,0.78)' : 'rgba(18,47,44,0.78)',
            backdropFilter: 'blur(18px)',
            border: '1px solid',
            borderColor: (theme) => (theme.palette.mode === 'light' ? 'rgba(72,97,97,0.14)' : 'rgba(143,191,182,0.12)'),
            boxShadow: '0 24px 60px -20px rgba(11,31,26,0.35)',
          }}
        >
          <Outlet />
        </Paper>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {t('auth.tagline')}
        </Typography>
      </Stack>
    </Box>
  );
}
