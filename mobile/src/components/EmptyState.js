import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing, typography } from '../theme/theme';
import { AppButton } from './AppButton';

export function EmptyState({ icon = 'package-variant', title, subtitle, onRetry, retryLabel }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <Icon name={icon} size={48} color={colors.textSecondary} />
      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
          {subtitle}
        </Text>
      ) : null}
      {onRetry ? (
        <AppButton title={retryLabel} onPress={onRetry} variant="outline" style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
});
