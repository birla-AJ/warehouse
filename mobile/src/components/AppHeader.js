import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing, typography } from '../theme/theme';

export function AppHeader({ title, subtitle, right }) {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const canGoBack = navigation?.canGoBack?.() ?? false;

  return (
    <View style={[styles.row, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {canGoBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.backButton}>
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[typography.h2, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: spacing.sm,
  },
});
