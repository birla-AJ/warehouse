import { createSlice } from '@reduxjs/toolkit';

function loadThemeMode() {
  const stored = localStorage.getItem('awms.themeMode');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
