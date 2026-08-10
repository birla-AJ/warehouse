import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../hooks/useAppTheme';
import { AppHeader } from './AppHeader';
import { EmptyState } from './EmptyState';
import { spacing } from '../theme/theme';

export function ListScreen({ title, queryKey, queryFn, renderItem, emptyIcon, emptyTitleKey }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn,
  });

  const items = data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={title} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <EmptyState icon="wifi-off" title={t('common.somethingWentWrong')} subtitle={t('common.networkError')} onRetry={refetch} retryLabel={t('common.retry')} />
      ) : items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={t(emptyTitleKey)} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, gap: spacing.sm },
});
