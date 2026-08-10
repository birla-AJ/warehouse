import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAppTheme } from '../hooks/useAppTheme';
import { changeLanguage } from '../i18n';
import { setLanguage } from '../store/slices/uiSlice';
import { radius, spacing, typography } from '../theme/theme';

const OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: '\u0939\u093f\u0928\u094d\u0926\u0940' },
];

export function LanguageToggle() {
  const { colors } = useAppTheme();
  const dispatch = useDispatch();
  const current = useSelector((state) => state.ui.language);

  const handleSelect = async (code) => {
    if (code === current) return;
    await changeLanguage(code);
    dispatch(setLanguage(code));
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceAlt }]}>
      {OPTIONS.map((opt) => {
        const active = opt.code === current;
        return (
          <TouchableOpacity
            key={opt.code}
            onPress={() => handleSelect(opt.code)}
            style={[styles.pill, active && { backgroundColor: colors.primary }]}
          >
            <Text style={[typography.bodyBold, { color: active ? '#fff' : colors.textSecondary }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 4,
    alignSelf: 'flex-start',
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
