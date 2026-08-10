import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  themeMode: 'light', // 'light' | 'dark'
  language: 'en', // 'en' | 'hi' — kept in sync with i18n/index.js's AsyncStorage value
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setThemeMode(state, action) {
      state.themeMode = action.payload;
    },
    toggleThemeMode(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    },
    setLanguage(state, action) {
      state.language = action.payload;
    },
  },
});

export const { setThemeMode, toggleThemeMode, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
