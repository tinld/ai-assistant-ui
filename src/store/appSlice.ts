import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  isSidebarOpen: boolean;
  isRecentConversationsOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: AppState = {
  isSidebarOpen: true,
  isRecentConversationsOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleRecentConversations: (state) => {
      state.isRecentConversationsOpen = !state.isRecentConversationsOpen;
    },
    setRecentConversationsOpen: (state, action: PayloadAction<boolean>) => {
      state.isRecentConversationsOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', state.theme);
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleRecentConversations,
  setRecentConversationsOpen,
  toggleTheme,
  setTheme,
} = appSlice.actions;

export default appSlice.reducer;
