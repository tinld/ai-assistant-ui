import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import appReducer from './appSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    app: appReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
