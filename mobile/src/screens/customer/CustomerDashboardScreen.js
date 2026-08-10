import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppHeader } from '../../components/AppHeader';
import { StatCard } from '../../components/StatCard';
import { fetchDashboardSummary } from '../../api/domain.api';
import { spacing } from '../../theme/theme';

function useGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greetingMorning';
  if (hour < 17) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

export function CustomerDashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const user = useSelector((state) => state.auth.user);
  const greetingKey = useGreetingKey();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={`${t(greetingKey)}${user?.name ? `, ${user.name}` : ''}`} subtitle={t('dashboard.staffOverview')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {isLoading ? (
          <Text style={{ color: colors.textSecondary }}>{t('common.loading')}</Text>
        ) : (
          <View style={styles.grid}>
            <StatCard icon="package-variant-closed" label={t('dashboard.inStorage')} value={data?.inventoryCount ?? 0} />
            <StatCard
              icon="truck-fast-outline"
              label={t('dashboard.dispatchedToday')}
              value={data?.todayDispatch ?? 0}
              accentColor={colors.info}
            />
            <StatCard
              icon="file-document-outline"
              label={t('dashboard.pendingInvoices')}
              value={data?.pendingBillsCount ?? 0}
              accentColor={colors.warning}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
