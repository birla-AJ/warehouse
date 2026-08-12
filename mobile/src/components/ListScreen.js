import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../hooks/useAppTheme';
import { AppHeader } from './AppHeader';
import { EmptyState } from './EmptyState';
import { spacing } from '../theme/theme';

const PAGE_SIZE = 20;

/**
 * Shared list screen used by Bags / Invoices / Dispatch / Farmers /
 * Warehouses. Backs onto real server-side pagination — the backend already
 * returns `{ items, meta: { page, limit, total, totalPages } }` for these
 * endpoints (see backend/src/modules/*.service.ts), so this fetches one
 * page at a time and loads more as the user scrolls, rather than pulling
 * every record up front. That matters here specifically because a busy
 * warehouse can accumulate thousands of bag records — a single unpaginated
 * fetch would slow the screen to a crawl (and waste mobile data) once the
 * dataset outgrows a demo environment.
 *
 * `queryFn` now receives `(page)` and must return `{ items, meta }` for
 * that page — see BagsScreen.js etc. for the call-site shape.
 */
export function ListScreen({ title, queryKey, queryFn, renderItem, emptyIcon, emptyTitleKey }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => queryFn(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
  });

  const items = useMemo(() => data?.pages.flatMap((page) => page.items ?? []) ?? [], [data]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // isRefetching stays true during background page-1 refetches triggered by
  // fetchNextPage's internal bookkeeping too, so pull-to-refresh spinner is
  // scoped to explicit refetch() calls via a dedicated flag would be more
  // precise — kept simple here since the visual difference is negligible.
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={title} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <EmptyState
          icon="wifi-off"
          title={t('common.somethingWentWrong')}
          subtitle={t('common.networkError')}
          onRetry={refetch}
          retryLabel={t('common.retry')}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={t(emptyTitleKey)} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => item.id ?? String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} colors={[colors.primary]} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null
          }
          initialNumToRender={PAGE_SIZE}
          maxToRenderPerBatch={PAGE_SIZE}
          windowSize={7}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, gap: spacing.sm },
  footer: { paddingVertical: spacing.lg, alignItems: 'center' },
});

export { PAGE_SIZE };
