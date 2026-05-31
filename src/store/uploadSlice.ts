import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UploadTask, UploadState } from '../types/upload.types';


const initialState: UploadState = {
  tasks: [],
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    addUploadTask: (state, action: PayloadAction<UploadTask>) => {
      state.tasks.unshift(action.payload);
    },
    updateUploadProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.progress = action.payload.progress;
      }
    },
    updateUploadStatus: (state, action: PayloadAction<{ id: string; status: 'processing' | 'uploaded' | 'indexed' | 'failed' }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.status = action.payload.status;
        if (action.payload.status === 'processing' || action.payload.status === 'uploaded' || action.payload.status === 'indexed') {
          task.progress = 100;
        }
      }
    },
    removeUploadTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    clearCompletedTasks: (state) => {
      state.tasks = state.tasks.filter(t => t.status === 'uploading' || t.status === 'processing');
    }
  },
});

export const { addUploadTask, updateUploadProgress, updateUploadStatus, removeUploadTask, clearCompletedTasks } = uploadSlice.actions;

export default uploadSlice.reducer;
