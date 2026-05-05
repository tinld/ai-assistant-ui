import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api, ApiError, API_URL } from '../services/api';
import type { RootState } from './index';
import type { ChatState, Message } from '../types';

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

// Thunks
export const fetchHistory = createAsyncThunk(
  'chat/fetchHistory',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) return rejectWithValue('No token');
    
    try {
      const response = await api.get<{ success: boolean; history: Message[] }>('/api/chat/history', token);
      return response.history;
    } catch (err: any) {
      if (err instanceof ApiError) return rejectWithValue(err.message);
      return rejectWithValue('Failed to fetch history');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageContent: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) return rejectWithValue('No token');
    
    try {
      const response = await api.post<{ success: boolean; response: string; user_message: string }>('/api/chat', { message: messageContent }, token);
      return response;
    } catch (err: any) {
      if (err instanceof ApiError) return rejectWithValue(err.message);
      return rejectWithValue('Failed to send message');
    }
  }
);

export const clearChat = createAsyncThunk(
  'chat/clearChat',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (!token) return rejectWithValue('No token');
    
    try {
      const response = await fetch(`${API_URL}/api/chat/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to clear chat');
      return true;
    } catch (err: any) {
      return rejectWithValue('Failed to clear chat');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Optimistic update for UI
    addLocalMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch History
      .addCase(fetchHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload || [];
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        // Append the AI's response
        state.messages.push({
          role: 'assistant',
          content: action.payload.response,
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Clear Chat
      .addCase(clearChat.fulfilled, (state) => {
        state.messages = [];
      });
  },
});

export const { addLocalMessage } = chatSlice.actions;
export default chatSlice.reducer;
