import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import appReducer from './appSlice';
import authReducer from './authSlice';
import uploadReducer from './uploadSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    app: appReducer,
    auth: authReducer,
    upload: uploadReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
