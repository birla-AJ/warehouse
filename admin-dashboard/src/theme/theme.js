import { createTheme } from '@mui/material/styles';

/**
 * Design direction — "Grain Ledger": an operations tool for people standing
 * in a warehouse or reconciling a ledger, built to the visual bar of
 * Linear/Stripe/Notion — restrained, precise, no decoration that doesn't
 * carry information. Palette pulls from the domain: steel-blue for
 * structure (racks, warehouses), warm grain-gold for what moves through it
 * (crop, money, alerts worth noticing). Deliberately not generic MUI-blue
 * or cream+terracotta.
 */

const fontDisplay = '"Manrope", "Inter", sans-serif';
const fontBody = '"Inter", "Manrope", sans-serif';
export const fontMono = '"JetBrains Mono", "Roboto Mono", monospace';

const steel = {
  50: '#EEF2F5', 100: '#D7E0E6', 200: '#AFC2CD', 300: '#87A3B3',
  400: '#5F859A', 500: '#3E677D', 600: '#2B4C5C', 700: '#203944',
  800: '#16262D', 900: '#0D1619',
};

const grain = {
  50: '#FBF3E3', 100: '#F4DFAF', 200: '#EACB84', 300: '#DDB35C',
  400: '#C8963E', 500: '#AD7C2C', 600: '#8C6221', 700: '#6B4A19',
};

const paperLight = '#FAF7F2';
const paperDark = '#141A1D';

function buildTheme(mode) {
  const isLight = mode === 'light';

  return {
    palette: {
      mode,
      primary: { main: steel[600], light: steel[400], dark: steel[800], contrastText: '#FFFFFF' },
      secondary: { main: grain[400], light: grain[200], dark: grain[600], contrastText: '#1A1400' },
      background: {
        default: isLight ? paperLight : paperDark,
        paper: isLight ? '#FFFFFF' : '#1B2226',
      },
      success: { main: '#3F8F5F' },
      warning: { main: '#C8963E' },
      error: { main: '#B24A3D' },
      info: { main: steel[400] },
      text: {
        primary: isLight ? steel[800] : '#EAEFF2',
        secondary: isLight ? steel[500] : steel[200],
      },
      divider: isLight ? 'rgba(43,76,92,0.14)' : 'rgba(234,239,242,0.12)',
    },
    typography: {
      fontFamily: fontBody,
      h1: { fontFamily: fontDisplay, fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontFamily: fontDisplay, fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontFamily: fontDisplay, fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontFamily: fontDisplay, fontWeight: 700 },
      h5: { fontFamily: fontDisplay, fontWeight: 700 },
      h6: { fontFamily: fontDisplay, fontWeight: 600 },
      button: { fontFamily: fontDisplay, fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: 10 },
    transitions: {
      duration: { shortest: 120, shorter: 160, short: 200, standard: 240 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#FFFFFF' : '#1B2226',
            color: isLight ? steel[800] : '#EAEFF2',
            boxShadow: 'none',
            borderBottom: `1px solid ${isLight ? 'rgba(43,76,92,0.12)' : 'rgba(234,239,242,0.1)'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isLight ? '#FFFFFF' : '#171E22',
            borderRight: `1px solid ${isLight ? 'rgba(43,76,92,0.12)' : 'rgba(234,239,242,0.1)'}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, paddingInline: 16 },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontFamily: fontBody, fontWeight: 600 } },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${isLight ? 'rgba(43,76,92,0.10)' : 'rgba(234,239,242,0.08)'}`,
            boxShadow: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: { head: { fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.03em' } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { fontSize: 12 } },
      },
    },
  };
}

export const lightTheme = createTheme(buildTheme('light'));
export const darkTheme = createTheme(buildTheme('dark'));

/** Occupancy status -> color, matches the backend's EMPTY/PARTIAL/FULL/DISABLED palette. */
export const occupancyColor = {
  EMPTY: '#3F8F5F',
  PARTIAL: '#C8963E',
  FULL: '#B24A3D',
  DISABLED: '#8A97A0',
};

/** Common status -> MUI color prop, used by StatusBadge across modules. */
export const statusColorMap = {
  ACTIVE: 'success', INACTIVE: 'default', SUSPENDED: 'error',
  IN_STORAGE: 'success', RESERVED: 'warning', DISPATCHED: 'info', DAMAGED: 'error',
  PENDING: 'warning', PARTIAL: 'warning', PAID: 'success', OVERDUE: 'error',
  ONLINE: 'success', OFFLINE: 'error', MAINTENANCE: 'warning',
  COMPLETED: 'success', CANCELLED: 'default', VERIFIED: 'info',
  APPROVED: 'success', REJECTED: 'error',
  SENT: 'success', FAILED: 'error',
  PRESENT: 'success', ABSENT: 'error', HALF_DAY: 'warning', LEAVE: 'info',
};
