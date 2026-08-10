import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { AuthStack } from './AuthStack';
import { AdminStack } from './AdminStack';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { selectIsAdmin, selectIsAuthenticated } from '../store/slices/authSlice';
import { useAppTheme } from '../hooks/useAppTheme';
import { palette } from '../theme/theme';

export function RootNavigator() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const { isDark, colors } = useAppTheme();

  const navTheme = {
    dark: isDark,
    colors: {
      primary: palette.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: palette.secondary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {!isAuthenticated ? <AuthStack /> : isAdmin ? <AdminStack /> : <CustomerTabNavigator />}
    </NavigationContainer>
  );
}
