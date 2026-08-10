import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '../theme/theme';

/**
 * Pure-JS animated splash (fade + scale logo, slide-up tagline, then a soft
 * pulse) shown while `App.js` waits for the auth-bootstrap check to finish.
 * onFinish() is called once the animation completes AND the auth check is
 * done — whichever finishes last — so the splash never feels rushed on a
 * fast device or hangs forever on a slow one.
 */
export function SplashScreen({ onFinish, ready }) {
  const { t } = useTranslation();
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.exp) }),
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 60 }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(taglineTranslate, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      ).start();
    });

    // Minimum splash time so it doesn't flash instantly on a fast device,
    // combined with the real "ready" flag from the auth bootstrap check.
    const minTimer = setTimeout(() => {
      if (ready) onFinish();
    }, 1400);

    return () => clearTimeout(minTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) {
      const timer = setTimeout(onFinish, 300);
      return () => clearTimeout(timer);
    }
  }, [ready, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={palette.primaryDark} />
      <Animated.View
        style={[
          styles.logoCircle,
          { opacity: logoOpacity, transform: [{ scale: Animated.multiply(logoScale, pulse) }] },
        ]}
      >
        <Text style={styles.logoText}>AW</Text>
      </Animated.View>

      <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineTranslate }] }}>
        <Text style={styles.appName}>{t('common.appName')}</Text>
        <Text style={styles.tagline}>{t('common.tagline')}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: palette.black,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.primaryDark,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 4,
  },
});
