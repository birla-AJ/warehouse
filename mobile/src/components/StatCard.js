import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing, typography } from '../theme/theme';

export function StatCard({ icon, label, value, accentColor, style }) {
  const { colors } = useAppTheme();
  const accent = accentColor ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}20` }]}>
        <Icon name={icon} size={22} color={accent} />
      </View>
      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.sm }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
