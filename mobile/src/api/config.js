/**
 * Android emulator can't reach the host machine's "localhost" — it must use
 * 10.0.2.2, which is a special alias to the host loopback. iOS simulator can
 * use localhost directly. A real device needs your machine's LAN IP.
 * Override this at build time or just edit it for your environment.
 */
import { Platform } from 'react-native';

const DEV_HOST = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const API_BASE_URL = __DEV__ ? `${DEV_HOST}/api/v1` : 'https://api.your-awms-domain.com/api/v1';
