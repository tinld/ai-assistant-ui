import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { createApiAxiosInstance } from './api';

const axiosInstance = createApiAxiosInstance();

const authHeaders = (token?: string | null): Record<string, string> => (
  token ? { Authorization: `Bearer ${token}` } : {}
);

export const knowledgeBaseApi = {
  /**
   * Upload a document to the Knowledge Base
   * @param file The File object to upload
   * @param token Optional auth token
   * @param onProgress Callback function for upload progress (0 to 100)
   * @returns A promise that resolves to the server response
   */
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

  /**
   * Get all uploaded documents for Knowledge Base
   * @param token Auth token
   */
  getDocuments: async (token: string | null) => {
    const config: AxiosRequestConfig = { headers: authHeaders(token) };
    const response = await axiosInstance.get('/api/rag/documents', config);
    return response.data;
  },

  /**
   * Get all facts from the Knowledge Base
   * @param token Auth token
   * @param limit Limit for pagination (optional)
   */
  getFacts: async (token: string | null, limit: number = 50) => {
    const config: AxiosRequestConfig = { headers: authHeaders(token) };
    const response = await axiosInstance.get(`/api/rag/facts?limit=${limit}`, config);
    return response.data;
  },

  /**
   * Update a fact in the Knowledge Base
   * @param factId ID of the fact to update
   * @param data Object containing updated text and domain
   * @param token Auth token
   */
  updateFact: async (factId: string, data: { text: string; domain?: string }, token: string | null) => {
    const config: AxiosRequestConfig = { headers: authHeaders(token) };
    const response = await axiosInstance.put(`/api/rag/facts/${factId}`, data, config);
    return response.data;
  },

  /**
   * Delete a fact from the Knowledge Base
   * @param factId ID of the fact to delete
   * @param token Auth token
   */
  deleteFact: async (factId: string, token: string | null) => {
    const config: AxiosRequestConfig = { headers: authHeaders(token) };
    const response = await axiosInstance.delete(`/api/rag/facts/${factId}`, config);
    return response.data;
  },
};
