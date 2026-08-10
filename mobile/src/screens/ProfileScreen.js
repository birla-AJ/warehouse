import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader } from '../components/AppHeader';
import { LanguageToggle } from '../components/LanguageToggle';
import { AppButton } from '../components/AppButton';
import { useAppTheme } from '../hooks/useAppTheme';
import { logout } from '../store/slices/authSlice';
import { toggleThemeMode } from '../store/slices/uiSlice';
import { clearSession } from '../store/sessionStorage';
import { radius, spacing, typography } from '../theme/theme';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await clearSession();
          dispatch(logout());
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('profile.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{(user?.name ?? user?.roleName ?? 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.sm }]}>{user?.name ?? '—'}</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>{user?.roleName}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.md }]}>{t('profile.language')}</Text>
          <LanguageToggle />
        </View>

        <View style={[styles.card, styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <Icon name={isDark ? 'weather-night' : 'white-balance-sunny'} size={20} color={colors.text} />
            <Text style={[typography.bodyBold, { color: colors.text, marginLeft: spacing.sm }]}>
              {isDark ? t('profile.darkMode') : t('profile.lightMode')}
            </Text>
          </View>
          <Switch value={isDark} onValueChange={() => dispatch(toggleThemeMode())} trackColor={{ true: colors.primary }} />
        </View>

        <AppButton
          title={t('profile.logout')}
          onPress={handleLogout}
          variant="outline"
          loading={loggingOut}
          style={{ marginTop: spacing.lg, borderColor: colors.danger }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, alignItems: 'center' },
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
});
