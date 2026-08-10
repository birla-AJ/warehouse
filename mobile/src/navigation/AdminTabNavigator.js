import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminWarehousesScreen } from '../screens/admin/AdminWarehousesScreen';
import { AdminFarmersScreen } from '../screens/admin/AdminFarmersScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAppTheme } from '../hooks/useAppTheme';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: 'view-dashboard-outline',
  Warehouses: 'warehouse',
  Farmers: 'account-group-outline',
  Reports: 'chart-bar',
  Profile: 'account-circle-outline',
};

export function AdminTabNavigator() {
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
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ tabBarLabel: t('nav.dashboard') }} />
      <Tab.Screen name="Warehouses" component={AdminWarehousesScreen} options={{ tabBarLabel: t('nav.warehouses') }} />
      <Tab.Screen name="Farmers" component={AdminFarmersScreen} options={{ tabBarLabel: t('nav.farmers') }} />
      <Tab.Screen name="Reports" component={AdminReportsScreen} options={{ tabBarLabel: t('nav.reports') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}
