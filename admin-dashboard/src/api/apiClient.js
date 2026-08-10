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

/** Pulls a human-readable message out of a NestJS error response. */
export function apiErrorMessage(error, fallback = 'Something went wrong') {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? fallback;
}
