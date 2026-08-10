import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing, typography } from '../theme/theme';

const STATUS_COLOR_MAP = {
  IN_STORAGE: 'success',
  RESERVED: 'warning',
  DISPATCHED: 'info',
  DAMAGED: 'danger',
  PENDING: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export function StatusBadge({ status, label }) {
  const { colors } = useAppTheme();
  const colorKey = STATUS_COLOR_MAP[status] ?? 'info';
  const color = colors[colorKey] ?? colors.info;

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[typography.caption, { color, fontWeight: '700' }]}>{label ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
