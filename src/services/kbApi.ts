import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { api, createApiAxiosInstance } from './api';

const axiosInstance = createApiAxiosInstance();

const authHeaders = (token?: string | null): Record<string, string> => (
  token ? { Authorization: `Bearer ${token}` } : {}
);

export const knowledgeBaseApi = {
  uploadDocument: async (file: File, token?: string | null, onProgress?: (progress: number) => void) => {
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
    return axiosInstance.post('/api/rag/upload', formData, config);
  },

  getDocuments: async (token: string | null) => {
    const config: AxiosRequestConfig = { headers: authHeaders(token) };
    const response = await axiosInstance.get('/api/rag/documents', config);
    return response.data;
  },

  updateDocument: async (documentId: string, name: string, token: string | null) => {
    return api.put<{ data: { document_id: string; name: string } }>(
      `/api/rag/documents/${documentId}`,
      { name },
      token,
    );
  },

  deleteDocument: async (documentId: string, token: string | null) => {
    return api.delete<{ message: string }>(`/api/rag/documents/${documentId}`, token);
  },

  setDocumentSearchEnabled: async (documentId: string, searchEnabled: boolean, token: string | null) => {
    return api.put<{ data: { document_id: string; search_enabled: boolean } }>(
      `/api/rag/documents/${documentId}/search-enabled`,
      { search_enabled: searchEnabled },
      token,
    );
  },

  getFacts: async (token: string | null, limit: number = 50) => {
    const config: AxiosRequestConfig = { headers: authHeaders(token) };
    const response = await axiosInstance.get(`/api/rag/facts?limit=${limit}`, config);
    return response.data;
  },

  updateFact: async (factId: string, data: { text: string; domain?: string }, token: string | null) => {
    const config: AxiosRequestConfig = { headers: authHeaders(token) };
    const response = await axiosInstance.put(`/api/rag/facts/${factId}`, data, config);
    return response.data;
  },

  deleteFact: async (factId: string, token: string | null) => {
    const config: AxiosRequestConfig = { headers: authHeaders(token) };
    const response = await axiosInstance.delete(`/api/rag/facts/${factId}`, config);
    return response.data;
  },
};
