import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

/**
 * Session persistence, split by sensitivity:
 *
 *  - accessToken / refreshToken → OS-level encrypted storage (iOS Keychain /
 *    Android Keystore via react-native-keychain). These are bearer
 *    credentials — anyone who reads them can act as the user. Plain
 *    AsyncStorage is unencrypted on-disk (a rooted device or a backup
 *    extraction tool can read it directly), so it's not acceptable for
 *    tokens in a production app.
 *  - user profile (id, name, role, etc.) → AsyncStorage is fine here. It's
 *    not a credential, and keeping it out of the Keychain means we can
 *    render "Welcome back, {name}" instantly on cold start without an
 *    async Keychain read blocking the first frame.
 *
 * The Keychain "service" name namespaces this app's entry so it doesn't
 * collide with any other app's credentials sharing the same device/team ID.
 */
const KEYCHAIN_SERVICE = 'com.awms.mobile.session';
const USER_STORAGE_KEY = '@awms/session_user';

export async function saveSession({ accessToken, refreshToken, user }) {
  try {
    await Keychain.setGenericPassword(
      'awms_session',
      JSON.stringify({ accessToken, refreshToken }),
      { service: KEYCHAIN_SERVICE },
    );
  } catch {
    // If the Keychain write fails (e.g. device policy blocks it), the user
    // will simply be asked to log in again next launch — non-fatal.
  }

  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user ?? null));
  } catch {
    // Non-fatal — worst case we don't have a cached profile for instant paint.
  }
}

export async function loadSession() {
  try {
    const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
    if (!credentials) return null;

    const { accessToken, refreshToken } = JSON.parse(credentials.password);
    if (!accessToken) return null;

    let user = null;
    try {
      const rawUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      user = rawUser ? JSON.parse(rawUser) : null;
    } catch {
      // Fall through with user: null — the app will still work, it just
      // won't have a cached profile until the next successful API call.
    }

    return { accessToken, refreshToken, user };
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  } catch {
    // Best-effort — nothing more we can do if the Keychain itself is failing.
  }
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Best-effort, same as above.
  }
}

/**
 * Called after a silent token refresh (apiClient.js) — only the tokens
 * changed, not the user profile, so this skips the AsyncStorage write.
 */
export async function updateStoredTokens({ accessToken, refreshToken }) {
  try {
    await Keychain.setGenericPassword(
      'awms_session',
      JSON.stringify({ accessToken, refreshToken }),
      { service: KEYCHAIN_SERVICE },
    );
  } catch {
    // Non-fatal — see saveSession() above.
  }
}
