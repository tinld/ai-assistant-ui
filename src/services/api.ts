import axios, { type AxiosError } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const AUTH_EXPIRED_MESSAGE = 'Your session has expired or your login token is invalid. Please sign in again.';

let unauthorizedHandler: ((message: string) => void) | null = null;

export const setUnauthorizedHandler = (handler: ((message: string) => void) | null) => {
  unauthorizedHandler = handler;
};

const notifyUnauthorized = () => {
  unauthorizedHandler?.(AUTH_EXPIRED_MESSAGE);
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  
  constructor(status: number, message: string, data: unknown = null) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response, wasAuthenticatedRequest = false): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && wasAuthenticatedRequest) {
      notifyUnauthorized();
    }

    const errorMsg = response.status === 401 && wasAuthenticatedRequest
      ? AUTH_EXPIRED_MESSAGE
      : getErrorMessage(data, response.statusText);
    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }

  return fallback;
};

export const createApiAxiosInstance = () => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 300000,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const requestHeaders = error.config?.headers as Record<string, string> | undefined;
      if (error.response?.status === 401 && Boolean(requestHeaders?.Authorization)) {
        notifyUnauthorized();
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const api = {
  get: async <T>(endpoint: string, token?: string | null): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return handleResponse<T>(response, Boolean(token));
  },

  post: async <T>(endpoint: string, body: unknown, token?: string | null): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response, Boolean(token));
  },

  put: async <T>(endpoint: string, body: unknown, token?: string | null): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response, Boolean(token));
  },

  delete: async <T>(endpoint: string, token?: string | null): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<T>(response, Boolean(token));
  },
};
