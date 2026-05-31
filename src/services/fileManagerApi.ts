import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { api, createApiAxiosInstance } from './api';
import type { FileItem } from '../types/file.types';

const axiosInstance = createApiAxiosInstance();

const authHeaders = (token?: string | null): Record<string, string> => (
  token ? { Authorization: `Bearer ${token}` } : {}
);

export const fileManagerApi = {
  uploadFile: async (file: File, token?: string | null, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: authHeaders(token),
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    };
    const response = await axiosInstance.post('/api/files/upload', formData, config);
    return response.data;
  },

  getFiles: async (token?: string | null): Promise<{ data: { files: FileItem[] } }> => {
    const response = await api.get<{ data?: { files?: FileItem[] }; files?: FileItem[] }>('/api/files', token);
    return {
      data: {
        files: response.data?.files ?? response.files ?? [],
      },
    };
  },

  updateFile: async (fileId: string, name: string, token?: string | null) => {
    return api.put<{ data: { file_id: string; name: string } }>(`/api/files/${fileId}`, { name }, token);
  },

  deleteFile: async (fileId: string, token?: string | null) => {
    return api.delete<{ message: string }>(`/api/files/${fileId}`, token);
  },

  syncToKnowledgeBase: async (fileId: string, token?: string | null) => {
    return api.post<{ document_id?: string; search_enabled?: boolean; file?: FileItem }>('/api/files/sync_to_kb', { file_id: fileId }, token);
  }
};
