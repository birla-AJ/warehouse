export const palette = {
  primary: '#1B5E20',
  primaryLight: '#4C8C4A',
  primaryDark: '#0A3D0A',
  secondary: '#F9A825',
  success: '#2E7D32',
  warning: '#ED6C02',
  danger: '#D32F2F',
  info: '#0288D1',

  white: '#FFFFFF',
  black: '#000000',

  grey50: '#FAFAFA',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey300: '#E0E0E0',
  grey400: '#BDBDBD',
  grey500: '#9E9E9E',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',
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
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  statusBar: 'dark-content',
  tabInactive: palette.grey400,
};

export const darkColors = {
  background: '#0F1410',
  surface: '#182018',
  surfaceAlt: '#1F2A1F',
  text: palette.grey100,
  textSecondary: palette.grey400,
  border: '#2A362A',
  primary: '#66BB6A',
  primaryLight: '#81C784',
  secondary: palette.secondary,
  success: '#66BB6A',
  warning: '#FFB74D',
  danger: '#EF5350',
  info: '#4FC3F7',
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
