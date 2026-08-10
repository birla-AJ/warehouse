import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

export function StatCard({ label, value, icon, sub, accent = 'secondary.main' }) {
  return (
    <Card>
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
          {icon && <Box sx={{ color: accent }}>{icon}</Box>}
        </Stack>
      </CardContent>
    </Card>
  );
}
