import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null, // { id, organizationId, roleId, roleName, name, email, mobile }
  isBootstrapping: true, // true while we're checking AsyncStorage for a saved session
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    loginSuccess(state, action) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
    sessionExpired(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
    bootstrapFinished(state) {
      state.isBootstrapping = false;
    },
    bootstrapRestore(state, action) {
      state.accessToken = action.payload.accessToken ?? null;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.user = action.payload.user ?? null;
      state.isBootstrapping = false;
    },
  },
});

export const {
  setTokens,
  setUser,
  loginSuccess,
  logout,
  sessionExpired,
  bootstrapFinished,
  bootstrapRestore,
} = authSlice.actions;

/** True once we're sure whether there's a logged-in session or not (post-bootstrap). */
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);

/**
 * The backend's Role model is fully dynamic (orgs create their own role
 * names) — there's no fixed "CUSTOMER" enum value. We treat any role whose
 * name contains "admin" (case-insensitive) as an admin; everything else
 * gets the staff/customer dashboard. Adjust this if your org's role naming
 * convention differs.
 */
export const selectIsAdmin = (state) => {
  const roleName = state.auth.user?.roleName ?? '';
  return roleName.toLowerCase().includes('admin');
};

export default authSlice.reducer;
