import axios from 'axios';
import { store } from '../store/store';
import { setTokens, sessionExpired } from '../store/slices/authSlice';
import { saveSession, clearSession } from '../store/sessionStorage';
import { API_BASE_URL } from './config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
  const { refreshToken, user } = store.getState().auth;
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const { accessToken, refreshToken: newRefreshToken } = response.data;
  store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
  await saveSession({ accessToken, refreshToken: newRefreshToken, user });
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
        await clearSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/** Pulls a human-readable message out of a NestJS error response. */
export function apiErrorMessage(error, fallback = 'common.somethingWentWrong') {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? fallback;
}
