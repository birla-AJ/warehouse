import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { store } from './src/store/store';
import { initI18n } from './src/i18n';
import { setLanguage } from './src/store/slices/uiSlice';
import { bootstrapRestore } from './src/store/slices/authSlice';
import { loadSession } from './src/store/sessionStorage';
import { SplashScreen } from './src/screens/SplashScreen';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Bootstrapper({ i18nInstance, onDone }) {
  const dispatch = useDispatch();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await loadSession();
      dispatch(bootstrapRestore(session ?? {}));
      dispatch(setLanguage(i18nInstance.language?.startsWith('hi') ? 'hi' : 'en'));
      setBootstrapped(true);
    })();
  }, [dispatch, i18nInstance]);

  if (showSplash) {
    return <SplashScreen ready={bootstrapped} onFinish={() => setShowSplash(false)} />;
  }

  return <RootNavigator />;
}

export default function App() {
  const [i18nInstance, setI18nInstance] = useState(null);

  useEffect(() => {
    initI18n().then(setI18nInstance);
  }, []);

  if (!i18nInstance) {
    // i18n resolves in a handful of milliseconds (just an AsyncStorage read),
    // so this bare view is essentially invisible in practice — the real
    // splash (with i18n-driven text) takes over immediately after.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18nInstance}>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <Bootstrapper i18nInstance={i18nInstance} />
            </QueryClientProvider>
          </Provider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
