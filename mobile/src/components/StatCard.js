import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing, typography } from '../theme/theme';
import { GradientView } from './GradientView';

export function StatCard({ icon, label, value, accentColor, style }) {
  const { colors } = useAppTheme();
  const accent = accentColor ?? colors.primary;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <GradientView preset="brand" direction="horizontal" style={styles.topBar} />
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
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
