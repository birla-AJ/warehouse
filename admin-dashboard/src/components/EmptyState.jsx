import { Box, Button, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/InboxOutlined';

export function EmptyState({ icon, title = 'Nothing here yet', description, actionLabel, onAction }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Box sx={{ color: 'text.disabled', mb: 1.5 }}>
        {icon ?? <InboxIcon sx={{ fontSize: 40 }} />}
      </Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mx: 'auto', mb: actionLabel ? 2.5 : 0 }}>
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
