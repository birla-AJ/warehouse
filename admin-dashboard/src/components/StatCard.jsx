import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { brandGradient, brandGradientSoft, brandGradientSoftDark } from '../theme/theme';

export function StatCard({ label, value, icon, sub, accent = 'secondary.main' }) {
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        '&:hover': { transform: 'translateY(-3px)' },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          height: 4,
          backgroundImage: brandGradient,
        },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary">
                {sub}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                color: accent,
                width: 44,
                height: 44,
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                background: (theme) =>
                  theme.palette.mode === 'light' ? brandGradientSoft : brandGradientSoftDark,
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
