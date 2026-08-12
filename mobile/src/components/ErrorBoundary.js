import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { palette, radius, spacing, typography } from '../theme/theme';

/**
 * Class component is required here — React error boundaries can only be
 * implemented with getDerivedStateFromError / componentDidCatch, there is
 * no hook equivalent (as of React 19).
 *
 * Without this, an uncaught render error anywhere in the tree unmounts the
 * entire app to a native red-screen/crash in production, which is a much
 * worse experience than a single recoverable "something went wrong" screen
 * with a retry button.
 *
 * Wire up a crash reporter (Sentry, Bugsnag, Crashlytics) in
 * componentDidCatch below before shipping — right now it only logs to the
 * console, which is invisible once the app is in someone's pocket.
 *
 * Deliberately does NOT use useAppTheme()/useTranslation() — this boundary
 * sits above the Redux/i18n providers in App.js specifically so it can
 * still render a fallback if *those* providers are what threw. Hardcoded
 * colors/English text here is a feature, not an oversight.
 */
export class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // TODO: send `error` + `errorInfo.componentStack` to a crash reporter.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            The app hit an unexpected error. Try again — if it keeps happening, restart the app.
          </Text>
          <AppButton title="Try again" onPress={this.handleReset} style={styles.button} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: palette.white,
  },
  title: { ...typography.h2, color: palette.grey900, textAlign: 'center' },
  body: {
    ...typography.body,
    color: palette.grey600,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  button: { paddingHorizontal: spacing.xl, borderRadius: radius.md },
});
