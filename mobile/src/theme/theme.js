/**
 * "Golden Grain + Forest Mint" mobile theme — matches the admin dashboard's
 * forest → mint brand gradient, with golden grain kept for money/harvest
 * accents. Export names are unchanged so every screen and component that
 * already imports from here keeps working.
 */

export const palette = {
  primary: '#122F2C', // forest-700
  primaryLight: '#8FBFB6', // forest mint
  primaryDark: '#0B1F1A', // deep forest
  secondary: '#D4A017', // golden grain
  accent: '#8FBFB6', // forest mint
  accentDeep: '#486161', // slate green
  success: '#22C55E',
  warning: '#D4A017',
  danger: '#EF4444',
  info: '#14B8A6',

  white: '#FFFFFF',
  black: '#000000',

  grey50: '#FAF8F3',
  grey100: '#F1F5F4',
  grey200: '#E6ECEB',
  grey300: '#D9E6E3',
  grey400: '#B4CDC7',
  grey500: '#7D8C89',
  grey600: '#486161',
  grey700: '#2F4744',
  grey800: '#122F2C',
  grey900: '#0F1A17',
};

/**
 * Brand gradient stops, consumed by <GradientView colors={gradients.brand}/>.
 * Kept in the dark-to-mid tonal range (never reaches the light mint end of
 * the palette) so white text/icons laid over it — button labels, splash
 * wordmark — stay legible across the whole gradient, not just the start.
 */
export const gradients = {
  brand: ['#0B1F1A', '#2F4744', '#486161'],
  brandVertical: ['#0B1F1A', '#2F4744'],
  sunrise: ['#D4A017', '#F4E6C1'],
  ocean: ['#122F2C', '#8FBFB6'],
};

export const lightColors = {
  background: palette.grey50,
  surface: palette.white,
  surfaceAlt: palette.grey100,
  text: palette.grey900,
  textSecondary: palette.grey600,
  border: palette.grey200,
  primary: palette.primary,
  primaryLight: palette.primaryLight,
  secondary: palette.secondary,
  accent: palette.accent,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  statusBar: 'dark-content',
  tabInactive: palette.grey400,
};

export const darkColors = {
  background: '#0B1F1A',
  surface: '#122F2C',
  surfaceAlt: '#0E2521',
  text: palette.grey100,
  textSecondary: palette.grey400,
  border: '#2F4744',
  primary: palette.primaryLight,
  primaryLight: '#B4CDC7',
  secondary: palette.secondary,
  accent: palette.accent,
  success: '#4ADE80',
  warning: '#E0C066',
  danger: '#F87171',
  info: '#5EEAD4',
  statusBar: 'light-content',
  tabInactive: palette.grey600,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '400' },
  button: { fontSize: 15, fontWeight: '700' },
};
