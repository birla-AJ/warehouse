import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing, typography } from '../theme/theme';
import { GradientView } from './GradientView';

export function AppButton({ title, onPress, variant = 'primary', disabled, loading, icon, style }) {
  const { colors } = useAppTheme();
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const content = loading ? (
    <ActivityIndicator color={isOutline || isGhost ? colors.primary : '#fff'} />
  ) : (
    <>
      {icon}
      <Text style={[styles.text, typography.button, { color: isOutline || isGhost ? colors.primary : '#fff' }]}>
        {title}
      </Text>
    </>
  );

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
      >
        {!isOutline && !isGhost ? (
          <GradientView preset="brand" direction="horizontal" style={[styles.base, styles.gradientShadow, style]}>
            {content}
          </GradientView>
        ) : (
          <Animated.View
            style={[
              styles.base,
              {
                backgroundColor: 'transparent',
                borderColor: isOutline ? colors.primary : 'transparent',
                borderWidth: isOutline ? 1.5 : 0,
              },
              style,
            ]}
          >
            {content}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
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
  gradientShadow: {
    shadowColor: '#0B1F1A',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  text: {
    textAlign: 'center',
  },
});
