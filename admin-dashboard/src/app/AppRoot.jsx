import { ThemeProvider, CssBaseline } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
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
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
