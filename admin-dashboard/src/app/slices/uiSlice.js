import { createSlice } from '@reduxjs/toolkit';

function loadThemeMode() {
  const stored = localStorage.getItem('awms.themeMode');
  if (stored === 'light' || stored === 'dark') return stored;
  // Always start on light, regardless of the OS/browser's prefers-color-scheme —
  // the person can still switch to dark via the header toggle, which is saved above.
  return 'light';
}

const initialState = {
  themeMode: loadThemeMode(),
  drawerOpen: true,
  searchOpen: false,
  notificationsOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleThemeMode(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('awms.themeMode', state.themeMode);
    },
    toggleDrawer(state, action) {
      state.drawerOpen = action.payload ?? !state.drawerOpen;
    },
    toggleSearch(state, action) {
      state.searchOpen = action.payload ?? !state.searchOpen;
    },
    toggleNotifications(state, action) {
      state.notificationsOpen = action.payload ?? !state.notificationsOpen;
    },
  },
});

export const { toggleThemeMode, toggleDrawer, toggleSearch, toggleNotifications } = uiSlice.actions;
export default uiSlice.reducer;
