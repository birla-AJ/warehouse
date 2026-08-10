import { Box, Button, Typography } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h3" fontWeight={800} gutterBottom>
        404
      </Typography>
      <Typography variant="h6" gutterBottom>
        Page not found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mb: 3 }}>
        The page you're looking for doesn't exist, or you may not have access to it.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Go to dashboard
        </Button>
      </Box>
    </Box>
  );
}
