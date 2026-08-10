import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing, typography } from '../theme/theme';
import { StatusBadge } from './StatusBadge';

/** rows: [{ label, value }] rendered as a 2-column grid under the title. */
export function ListItemCard({ title, status, rows = [] }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {status ? <StatusBadge status={status} /> : null}
      </View>
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.label} style={styles.gridItem}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{row.label}</Text>
            <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: { minWidth: '40%' },
});
