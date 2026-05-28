import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthState } from '../types/auth.types';


// Check localStorage to initialize state if the user was already logged in
const storedToken = localStorage.getItem('access_token');
const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  authNotice: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; access_token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.access_token;
      state.isAuthenticated = true;
      state.authNotice = null;
      // Store in localStorage for persistence across reloads
      localStorage.setItem('access_token', action.payload.access_token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.authNotice = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    },
    logoutWithNotice: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.authNotice = action.payload;
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    },
    clearAuthNotice: (state) => {
      state.authNotice = null;
    },
  },
});

export const { setCredentials, logout, logoutWithNotice, clearAuthNotice } = authSlice.actions;
export default authSlice.reducer;
