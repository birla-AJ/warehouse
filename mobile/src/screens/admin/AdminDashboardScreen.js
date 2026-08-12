import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useGreetingKey } from '../../hooks/useGreetingKey';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { fetchDashboardSummary } from '../../api/domain.api';
import { radius, spacing, typography } from '../../theme/theme';
import { GradientView } from '../../components/GradientView';

const QUICK_ACTIONS = [
  { key: 'Bags', icon: 'package-variant-closed', labelKey: 'nav.bags' },
  { key: 'Invoices', icon: 'file-document-outline', labelKey: 'nav.invoices' },
  { key: 'Dispatch', icon: 'truck-fast-outline', labelKey: 'nav.dispatch' },
];

export function AdminDashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);
  const greetingKey = useGreetingKey();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
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
      <AppHeader title={`${t(greetingKey)}${user?.name ? `, ${user.name}` : ''}`} subtitle={t('dashboard.adminOverview')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {isLoading ? (
          <Text style={{ color: colors.textSecondary }}>{t('common.loading')}</Text>
        ) : isError ? (
          <EmptyState
            icon="wifi-off"
            title={t('common.somethingWentWrong')}
            subtitle={t('common.networkError')}
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        ) : (
          <>
            <View style={styles.grid}>
              <StatCard icon="package-variant-closed" label={t('dashboard.inStorage')} value={data?.inventoryCount ?? 0} />
              <StatCard icon="truck-fast-outline" label={t('dashboard.dispatchedToday')} value={data?.todayDispatch ?? 0} accentColor={colors.info} />
            </View>
            <View style={styles.grid}>
              <StatCard icon="account-group-outline" label={t('dashboard.activeFarmers')} value={data?.farmerCount ?? 0} accentColor={colors.secondary} />
              <StatCard
                icon="file-document-outline"
                label={t('dashboard.pendingInvoices')}
                value={data?.pendingBillsCount ?? 0}
                accentColor={colors.warning}
              />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <GradientView preset="brand" direction="horizontal" style={styles.cardTopBar} />
              <Text style={[typography.h3, { color: colors.text }]}>{t('dashboard.occupancy')}</Text>
              <Text style={[typography.h1, { color: colors.primary, marginTop: spacing.sm }]}>
                {data?.warehouseOccupancy?.occupancyPercent ?? 0}%
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {data?.warehouseOccupancy?.occupiedPositions ?? 0} / {data?.warehouseOccupancy?.totalPositions ?? 0}
              </Text>
            </View>

            <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>{t('dashboard.quickActions')}</Text>
            <View style={styles.grid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => navigation.navigate(action.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${colors.primary}18` }]}>
                    <Icon name={action.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={[typography.bodyBold, { color: colors.text, marginTop: spacing.xs }]}>{t(action.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  grid: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, overflow: 'hidden', position: 'relative' },
  cardTopBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  actionCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
