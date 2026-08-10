import { useSelector } from 'react-redux';
import { lightColors, darkColors } from '../theme/theme';

export function useAppTheme() {
  const themeMode = useSelector((state) => state.ui.themeMode);
  const colors = themeMode === 'dark' ? darkColors : lightColors;
  return { colors, themeMode, isDark: themeMode === 'dark' };
}
