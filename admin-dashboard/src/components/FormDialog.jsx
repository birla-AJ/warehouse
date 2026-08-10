import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
  maxWidth = 'sm',
  children,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pr: 1 }}>
        <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {children}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving…' : submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
