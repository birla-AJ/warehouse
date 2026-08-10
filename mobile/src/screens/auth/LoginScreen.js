import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppTextInput } from '../../components/AppTextInput';
import { AppButton } from '../../components/AppButton';
import { LanguageToggle } from '../../components/LanguageToggle';
import { login as loginApi } from '../../api/auth.api';
import { apiErrorMessage } from '../../api/apiClient';
import { loginSuccess } from '../../store/slices/authSlice';
import { saveSession } from '../../store/sessionStorage';
import { palette, radius, spacing, typography } from '../../theme/theme';

export function LoginScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const dispatch = useDispatch();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const validate = () => {
    const next = {};
    if (!identifier.trim()) next.identifier = t('auth.fieldRequired');
    if (!password) next.password = t('auth.fieldRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await loginApi({ identifier: identifier.trim(), password });
      dispatch(loginSuccess(data));
      await saveSession(data);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        setFormError(t('auth.invalidCredentials'));
      } else if (status === 403) {
        setFormError(t('auth.accountInactive'));
      } else {
        setFormError(t(apiErrorMessage(error, 'common.networkError')));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.logoCircle, { backgroundColor: palette.primary }]}>
          <Text style={styles.logoText}>AW</Text>
        </View>

        <Text style={[typography.h1, { color: colors.text, marginTop: spacing.lg }]}>{t('auth.welcomeBack')}</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
          {t('auth.loginSubtitle')}
        </Text>

        <AppTextInput
          label={t('auth.emailOrMobile')}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@example.com"
          icon="account-outline"
          error={errors.identifier}
        />
        <AppTextInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          icon="lock-outline"
          secureTextEntry
          error={errors.password}
        />

        {formError ? (
          <View style={[styles.errorBox, { backgroundColor: `${colors.danger}15` }]}>
            <Text style={[typography.body, { color: colors.danger }]}>{formError}</Text>
          </View>
        ) : null}

        <AppButton title={loading ? t('auth.loggingIn') : t('auth.login')} onPress={handleLogin} loading={loading} />

        <View style={styles.footerRow}>
          <LanguageToggle />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  footerRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
