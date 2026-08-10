import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AdminTabNavigator } from './AdminTabNavigator';
import { BagsScreen } from '../screens/shared/BagsScreen';
import { InvoicesScreen } from '../screens/shared/InvoicesScreen';
import { DispatchScreen } from '../screens/shared/DispatchScreen';
import { useAppTheme } from '../hooks/useAppTheme';

const Stack = createNativeStackNavigator();

export function AdminStack() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Bags" component={BagsScreen} options={{ title: t('bags.title'), headerShown: false }} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: t('invoices.title'), headerShown: false }} />
      <Stack.Screen name="Dispatch" component={DispatchScreen} options={{ title: t('dispatch.title'), headerShown: false }} />
    </Stack.Navigator>
  );
}
