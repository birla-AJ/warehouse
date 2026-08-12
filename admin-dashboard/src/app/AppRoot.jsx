import { ThemeProvider, CssBaseline, IconButton } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { SnackbarProvider, closeSnackbar } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import { useAppSelector } from '../hooks/redux';
import { lightTheme, darkTheme } from '../theme/theme';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { router } from './router';

export function AppRoot() {
  const themeMode = useAppSelector((s) => s.ui.themeMode);
  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={(snackbarId) => (
          <IconButton size="small" aria-label="Dismiss" onClick={() => closeSnackbar(snackbarId)} sx={{ color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      >
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
