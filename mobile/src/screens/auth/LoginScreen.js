import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import { GradientView } from '../../components/GradientView';
import { AwmsMark } from '../../components/AwmsMark';
import { login as loginApi } from '../../api/auth.api';
import { apiErrorMessage } from '../../api/apiClient';
import { loginSuccess } from '../../store/slices/authSlice';
import { saveSession } from '../../store/sessionStorage';
import { radius, spacing, typography } from '../../theme/theme';

function FloatingOrb({ size, top, left, right, bottom, colorStyle, duration, distance = 18 }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [drift, duration]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        colorStyle,
        { width: size, height: size, borderRadius: size / 2, top, left, right, bottom, transform: [{ translateY }] },
      ]}
    />
  );
}

export function LoginScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const dispatch = useDispatch();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [cardOpacity, cardTranslate]);

  const validate = () => {
    const next = {};
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      next.identifier = t('auth.fieldRequired');
    } else {
      // Accepts either an email address or a 10-digit Indian mobile number
      // (matching what the backend's login DTO accepts — see
      // backend/src/modules/auth). Catching an obviously-malformed
      // identifier here means the user gets instant feedback instead of
      // waiting on a round trip to the server for something client-side
      // validation could've caught immediately.
      const isEmailLike = trimmedIdentifier.includes('@');
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const MOBILE_RE = /^[6-9]\d{9}$/;
      const isValid = isEmailLike ? EMAIL_RE.test(trimmedIdentifier) : MOBILE_RE.test(trimmedIdentifier);
      if (!isValid) {
        next.identifier = isEmailLike ? t('auth.invalidEmail') : t('auth.invalidMobile');
      }
    }

    if (!password) {
      next.password = t('auth.fieldRequired');
    } else if (password.length < 6) {
      next.password = t('auth.passwordTooShort');
    }

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
    <View style={{ flex: 1 }}>
      <GradientView preset="brand" style={StyleSheet.absoluteFill} />
      <FloatingOrb size={220} top={-60} left={-50} colorStyle={styles.orbViolet} duration={4200} />
      <FloatingOrb size={260} bottom={-80} right={-60} colorStyle={styles.orbCyan} duration={5200} distance={24} />
      <FloatingOrb size={120} top={140} right={30} colorStyle={styles.orbAmber} duration={3600} distance={14} />

      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <AwmsMark size={56} rounded={16} />
            <Text style={styles.brandText}>AWMS</Text>
          </View>

          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? 'rgba(26,20,54,0.92)' : 'rgba(255,255,255,0.94)',
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslate }],
              },
            ]}
          >
            <Text style={[typography.h1, { color: colors.text }]}>{t('auth.welcomeBack')}</Text>
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
              <View style={[styles.errorBox, { backgroundColor: `${colors.danger}18` }]}>
                <Text style={[typography.body, { color: colors.danger }]}>{formError}</Text>
              </View>
            ) : null}

            <AppButton title={loading ? t('auth.loggingIn') : t('auth.login')} onPress={handleLogin} loading={loading} />
          </Animated.View>

          <View style={styles.footerRow}>
            <LanguageToggle />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: '#0B1F1A',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  footerRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  orb: { position: 'absolute' },
  orbViolet: { backgroundColor: 'rgba(143,191,182,0.45)' },
  orbCyan: { backgroundColor: 'rgba(72,97,97,0.4)' },
  orbAmber: { backgroundColor: 'rgba(212,160,23,0.35)' },
});
