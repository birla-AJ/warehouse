import axios from 'axios';
import { store } from '../app/store';
import { sessionExpired, setTokens } from '../app/slices/authSlice';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = store.getState().auth;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const { refreshToken } = store.getState().auth;
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, { refreshToken });
  const { accessToken, refreshToken: newRefreshToken } = response.data;
  store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccessToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(sessionExpired());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Pulls a human-readable message out of a NestJS error response.
 *
 * Returns an i18n KEY ('common.networkError' / 'common.somethingWentWrong')
 * for our own fallback cases — callers must t() it. When the backend sent
 * an actual message, that text is returned as-is: it's plain English from
 * the NestJS DTO layer (e.g. "Invalid email/mobile or password"), and
 * translating it would require the backend to return i18n keys instead of
 * literal strings — a separate, backend-side effort not covered here.
 */
export function apiErrorMessage(error, fallback = 'common.somethingWentWrong') {
  if (!error?.response) {
    // No `response` means the request never got a reply — offline, timed
    // out, or the server is unreachable, distinct from a 4xx/5xx reply.
    return 'common.networkError';
  }
  const message = error.response.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? fallback;
}
