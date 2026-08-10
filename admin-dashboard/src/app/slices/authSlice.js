import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'awms.session';

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null, user: null, permissions: null };
    return { permissions: null, ...JSON.parse(raw) };
  } catch {
    return { accessToken: null, refreshToken: null, user: null, permissions: null };
  }
}

function persist(state) {
  if (state.accessToken) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    setSession(state, action) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      persist(state);
    },
    setTokens(state, action) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      persist(state);
    },
    setPermissions(state, action) {
      state.permissions = action.payload;
      persist(state);
    },
    sessionExpired(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.permissions = null;
      persist(state);
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.permissions = null;
      persist(state);
    },
  },
});

export const { setSession, setTokens, setPermissions, sessionExpired, logout } = authSlice.actions;
export default authSlice.reducer;
