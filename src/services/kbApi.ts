import axios from 'axios';
import { API_URL } from './api';

// Create an Axios instance with base configuration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds timeout for large files
});

export const knowledgeBaseApi = {
  /**
   * Upload a document to the Knowledge Base
   * @param file The File object to upload
   * @param token Optional auth token
   * @param onProgress Callback function for upload progress (0 to 100)
   * @returns A promise that resolves to the server response
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uploadDocument: async (file: File, token?: string | null, onProgress?: (progress: number) => void) => {
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

    return axiosInstance.post('/api/rag/upload', formData, config);
  },

  /**
   * Get all uploaded documents for Knowledge Base
   * @param token Auth token
   */
  getDocuments: async (token: string | null) => {
    const config: any = { headers: {} };
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await axiosInstance.get('/api/rag/documents', config);
    return response.data;
  },
};
