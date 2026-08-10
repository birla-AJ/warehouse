import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@awms/session';

export async function saveSession({ accessToken, refreshToken, user }) {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ accessToken, refreshToken, user }));
  } catch {
    // Non-fatal — the user just won't stay logged in across restarts on this device.
  }
}

export async function loadSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // Best-effort — nothing more we can do if storage itself is failing.
  }
}
