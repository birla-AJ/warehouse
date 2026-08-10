import { Component } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * Class component is required here — React error boundaries can only be
 * implemented with getDerivedStateFromError/componentDidCatch, there's no
 * hooks equivalent. Wraps the whole app in AppRoot so a crash in any one
 * page shows a recoverable screen instead of a blank white page.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Swap for a real error-tracking call (Sentry, etc.) once one is wired up.
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign('/dashboard');
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            bgcolor: 'background.default',
          }}
        >
          <Paper variant="outlined" sx={{ p: 4, maxWidth: 460, textAlign: 'center' }}>
            <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected error occurred while rendering this page. You can try reloading, or head
              back to the dashboard.
            </Typography>
            {import.meta.env.DEV && this.state.error && (
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  display: 'block',
                  textAlign: 'left',
                  bgcolor: 'action.hover',
                  p: 1.5,
                  borderRadius: 1,
                  mb: 3,
                  overflow: 'auto',
                  maxHeight: 160,
                }}
              >
                {String(this.state.error?.stack ?? this.state.error)}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                Reload
              </Button>
              <Button variant="contained" onClick={this.handleReset}>
                Go to dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
