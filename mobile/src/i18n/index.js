import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';
import en from './locales/en.json';
import hi from './locales/hi.json';

export const LANGUAGE_STORAGE_KEY = '@awms/language';
export const SUPPORTED_LANGUAGES = ['en', 'hi'];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

/** Picks the best supported language: saved preference > device locale > English. */
async function resolveInitialLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch {
    // AsyncStorage unavailable (first boot / cleared) — fall through to device locale.
  }

  const best = RNLocalize.findBestLanguageTag(SUPPORTED_LANGUAGES);
  return best?.languageTag ?? 'en';
}

export async function initI18n() {
  const lng = await resolveInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  return i18n;
}

export async function changeLanguage(lng) {
  if (!SUPPORTED_LANGUAGES.includes(lng)) return;
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
}

export default i18n;
