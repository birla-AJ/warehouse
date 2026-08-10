import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Auth tokens are plain strings, not the concern here — this just
      // silences RTK's default serializable-check noise from third-party
      // navigation/persist actions during dev.
      serializableCheck: false,
    }),
});
