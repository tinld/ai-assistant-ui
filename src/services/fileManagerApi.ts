import axios from 'axios';
import { API_URL, api } from './api';
import type { FileItem } from '../types/file.types';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});


export const fileManagerApi = {
  uploadFile: async (file: File, token?: string | null, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const config: any = {
      headers: {},
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axiosInstance.post('/api/files/upload', formData, config);
    return response.data;
  },

  getFiles: async (token?: string | null): Promise<{ data: { files: FileItem[] } }> => {
    return api.get<{ data: { files: FileItem[] } }>('/api/files', token);
  },

  syncToKnowledgeBase: async (fileId: string, token?: string | null) => {
    return api.post<{ data: any }>('/api/files/sync_to_kb', { file_id: fileId }, token);
  }
};
