import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CustomerDashboardScreen } from '../screens/customer/CustomerDashboardScreen';
import { BagsScreen } from '../screens/shared/BagsScreen';
import { InvoicesScreen } from '../screens/shared/InvoicesScreen';
import { DispatchScreen } from '../screens/shared/DispatchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAppTheme } from '../hooks/useAppTheme';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: 'view-dashboard-outline',
  Bags: 'package-variant-closed',
  Invoices: 'file-document-outline',
  Dispatch: 'truck-fast-outline',
  Profile: 'account-circle-outline',
};

export function CustomerTabNavigator() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => <Icon name={ICONS[route.name]} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={CustomerDashboardScreen} options={{ tabBarLabel: t('nav.dashboard') }} />
      <Tab.Screen name="Bags" component={BagsScreen} options={{ tabBarLabel: t('nav.bags') }} />
      <Tab.Screen name="Invoices" component={InvoicesScreen} options={{ tabBarLabel: t('nav.invoices') }} />
      <Tab.Screen name="Dispatch" component={DispatchScreen} options={{ tabBarLabel: t('nav.dispatch') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}
