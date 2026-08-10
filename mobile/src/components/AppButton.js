import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing, typography } from '../theme/theme';

export function AppButton({ title, onPress, variant = 'primary', disabled, loading, icon, style }) {
  const { colors } = useAppTheme();
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: isOutline ? 'transparent' : colors.primary,
          borderColor: colors.primary,
          borderWidth: isOutline ? 1.5 : 0,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, typography.button, { color: isOutline ? colors.primary : '#fff' }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});
