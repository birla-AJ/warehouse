import { createTheme } from '@mui/material/styles';

/**
 * Design direction — "Golden Grain + Forest Mint": a premium agri-tech
 * palette for a warehouse operations platform. Deep forest greens anchor
 * the UI, forest mint and golden grain carry brand accents and gradients,
 * warm gold marks money/harvest-adjacent data. Calm, soft-shadowed
 * surfaces with restrained motion — enterprise-grade, not flashy.
 */

const fontDisplay = '"Inter", "Manrope", sans-serif';
const fontBody = '"Inter", "Manrope", sans-serif';
export const fontMono = '"JetBrains Mono", "Roboto Mono", monospace';

export const brandGradient = 'linear-gradient(90deg, #0B1F1A 0%, #2F4744 55%, #486161 100%)';
export const brandGradientSoft = 'linear-gradient(135deg, rgba(15,58,51,0.10), rgba(143,191,182,0.14))';
export const brandGradientSoftDark = 'linear-gradient(135deg, rgba(143,191,182,0.20), rgba(212,160,23,0.16))';
export const goldGradient = 'linear-gradient(90deg, #D4A017 0%, #F4E6C1 100%)';
export const goldGradientSoft = 'linear-gradient(135deg, rgba(212,160,23,0.14), rgba(244,230,193,0.22))';

const forest = {
  50: '#EEF4F2', 100: '#D9E6E3', 200: '#B4CDC7', 300: '#8FBFB6',
  400: '#6E9A92', 500: '#486161', 600: '#2F4744', 700: '#122F2C',
  800: '#0E2521', 900: '#0B1F1A',
};

const gold = {
  100: '#F4E6C1', 200: '#EBD494', 300: '#E0C066', 400: '#D4A017',
  500: '#B77B1E', 600: '#96631A', 700: '#754C14',
};

const mint = forest[300]; // #8FBFB6

const paperLight = '#FAF8F3';
const paperDark = '#0B1F1A';

function buildTheme(mode) {
  const isLight = mode === 'light';

  return {
    palette: {
      mode,
      primary: { main: forest[700], light: forest[400], dark: forest[900], contrastText: '#FFFFFF' },
      secondary: { main: gold[400], light: gold[200], dark: gold[500], contrastText: '#0F1A17' },
      background: {
        default: isLight ? paperLight : paperDark,
        paper: isLight ? '#FFFFFF' : '#122F2C',
      },
      success: { main: '#22C55E' },
      warning: { main: '#D4A017' },
      error: { main: '#EF4444' },
      info: { main: '#14B8A6' },
      text: {
        primary: isLight ? '#0F1A17' : '#EAF1EF',
        secondary: isLight ? '#486161' : '#A9C2BD',
      },
      divider: isLight ? '#E6ECEB' : 'rgba(230,236,235,0.12)',
    },
    typography: {
      fontFamily: fontBody,
      h1: { fontFamily: fontDisplay, fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontFamily: fontDisplay, fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontFamily: fontDisplay, fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontFamily: fontDisplay, fontWeight: 700 },
      h5: { fontFamily: fontDisplay, fontWeight: 700 },
      h6: { fontFamily: fontDisplay, fontWeight: 600 },
      button: { fontFamily: fontDisplay, fontWeight: 700, textTransform: 'none' },
    },
    shape: { borderRadius: 12 },
    transitions: {
      duration: { shortest: 140, shorter: 180, short: 220, standard: 260 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isLight
              ? 'radial-gradient(circle at 100% 0%, rgba(143,191,182,0.10), transparent 40%), radial-gradient(circle at 0% 100%, rgba(212,160,23,0.06), transparent 40%)'
              : 'radial-gradient(circle at 100% 0%, rgba(143,191,182,0.10), transparent 40%), radial-gradient(circle at 0% 100%, rgba(212,160,23,0.08), transparent 40%)',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? 'rgba(250,248,243,0.86)' : 'rgba(18,47,44,0.88)',
            backdropFilter: 'blur(14px)',
            color: isLight ? '#0F1A17' : '#EAF1EF',
            boxShadow: 'none',
            borderBottom: `1px solid ${isLight ? '#E6ECEB' : 'rgba(230,236,235,0.1)'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isLight ? '#FFFFFF' : '#0E2521',
            borderRight: `1px solid ${isLight ? '#E6ECEB' : 'rgba(230,236,235,0.1)'}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            paddingInline: 18,
            transition: 'transform 180ms ease, box-shadow 180ms ease',
          },
          contained: {
            backgroundImage: brandGradient,
            boxShadow: '0 8px 20px -8px rgba(11,31,26,0.45)',
            '&:hover': {
              boxShadow: '0 10px 26px -8px rgba(11,31,26,0.55)',
              transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': { backgroundImage: 'none' },
          },
          containedSecondary: {
            backgroundImage: goldGradient,
            color: '#0F1A17',
            boxShadow: '0 8px 20px -8px rgba(212,160,23,0.45)',
          },
          outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontFamily: fontBody, fontWeight: 700, borderRadius: 8 } },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${isLight ? '#E6ECEB' : 'rgba(230,236,235,0.08)'}`,
            borderRadius: 16,
            boxShadow: isLight
              ? '0 6px 24px -14px rgba(11,31,26,0.22)'
              : '0 6px 24px -14px rgba(0,0,0,0.5)',
            transition: 'transform 200ms ease, box-shadow 200ms ease',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: { head: { fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.03em' } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'background 160ms ease, color 160ms ease',
            '&.Mui-selected': {
              backgroundImage: isLight ? brandGradientSoft : brandGradientSoftDark,
              color: forest[isLight ? 700 : 300],
              '&:hover': { backgroundImage: isLight ? brandGradientSoft : brandGradientSoftDark },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { fontSize: 12, borderRadius: 8 } },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'box-shadow 160ms ease',
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${isLight ? 'rgba(72,97,97,0.16)' : 'rgba(143,191,182,0.22)'}` },
          },
        },
      },
    },
  };
}

export const lightTheme = createTheme(buildTheme('light'));
export const darkTheme = createTheme(buildTheme('dark'));

/** Occupancy status -> color, matches the backend's EMPTY/PARTIAL/FULL/DISABLED palette. */
export const occupancyColor = {
  EMPTY: '#22C55E',
  PARTIAL: '#D4A017',
  FULL: '#EF4444',
  DISABLED: '#7D8C89',
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
