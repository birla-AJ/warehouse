import { Box, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

export function PlaceholderPage({ title }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <ConstructionIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This screen hasn't been built yet.
      </Typography>
    </Box>
  );
}
