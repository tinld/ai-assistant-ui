import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'indexed' | 'failed';
  size: number;
}

interface UploadState {
  tasks: UploadTask[];
}

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
    updateUploadStatus: (state, action: PayloadAction<{ id: string; status: 'indexed' | 'failed' }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.status = action.payload.status;
        if (action.payload.status === 'indexed') {
          task.progress = 100;
        }
      }
    },
    removeUploadTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    clearCompletedTasks: (state) => {
      state.tasks = state.tasks.filter(t => t.status === 'uploading');
    }
  },
});

export const { addUploadTask, updateUploadProgress, updateUploadStatus, removeUploadTask, clearCompletedTasks } = uploadSlice.actions;

export default uploadSlice.reducer;
